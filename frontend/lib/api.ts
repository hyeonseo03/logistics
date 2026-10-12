// 화면은 반드시 이 파일의 함수만 호출한다.
// 지금은 mocks 데이터를 돌려주고, 나중에 백엔드가 생기면 함수 안쪽만 fetch 로 바꾼다.
// (함수 이름, 받는 값, 돌려주는 타입은 그대로 유지한다)

import { addresses } from "@/mocks/addresses";
import { categories } from "@/mocks/categories";
import { inventory } from "@/mocks/inventory";
import { orderClaims } from "@/mocks/orderClaims";
import { orderItems } from "@/mocks/orderItems";
import { orders } from "@/mocks/orders";
import { products } from "@/mocks/products";
import { restockAlerts } from "@/mocks/restockAlerts";
import { shipmentEvents } from "@/mocks/shipmentEvents";
import { shipments } from "@/mocks/shipments";
import { userPasswords } from "@/mocks/userPasswords";
import { users } from "@/mocks/users";
import { warehouses } from "@/mocks/warehouses";
import type {
  AdminOrder,
  AdminShipment,
  DailyOrderCount,
  DashboardSummary,
  InventoryCell,
  InventoryRow,
  InventoryTable,
} from "@/types/admin";
import type { AiChatRequest, AiChatResponse } from "@/types/ai";
import type { ClaimType, ClaimWithOrder } from "@/types/claim";
import type {
  CreateOrderRequest,
  Order,
  OrderItemWithProduct,
  OrderStatus,
  OrderWithDetails,
} from "@/types/order";
import type {
  Category,
  Product,
  ProductSearchParams,
  ProductStock,
  ProductResponse,
  ProductWithStock,
  RestockAlert,
  RestockAlertWithProduct,
} from "@/types/product";
import type { Shipment, ShipmentDetail, ShipmentStatus } from "@/types/shipment";
import type {
  Address,
  AddressRequest,
  MyPageSummary,
  UpdateProfileRequest,
  User,
  UserRole,
} from "@/types/user";
import type { Warehouse } from "@/types/warehouse";
import { toDateKey } from "@/lib/format";
import { getShippingFee } from "@/lib/price";
import { orderStatusLabel, shipmentStatusLabel, shipmentSteps } from "@/lib/labels";
import {
  LOW_STOCK_THRESHOLD,
  getAvailableQuantity,
  getDistanceRank,
  getEstimatedArrivalDate,
  getRegionFromAddress,
  getStockStatus,
} from "@/lib/stock";
import { isValidName, isValidPassword, isValidPhone } from "@/lib/validation";

// 가짜 로그인: 로그인한 회원 id 를 브라우저 localStorage 에 저장한다
// (나중에 백엔드가 생기면 이 자리에 로그인 토큰을 저장하게 된다)
const SESSION_KEY = "logistics_user_id";

function getSessionUserId(): number | null {
  if (typeof window === "undefined") return null; // 서버에서 실행될 때는 localStorage 가 없다
  const saved = localStorage.getItem(SESSION_KEY);
  return saved ? Number(saved) : null;
}

// 로그인이 꼭 필요한 함수에서 사용한다
function requireLogin(): User {
  const user = users.find((u) => u.id === getSessionUserId());
  if (!user) throw new Error("로그인이 필요합니다.");
  return user;
}

// ───────── 실제 백엔드 호출 ─────────

// 백엔드 주소. .env.local 의 NEXT_PUBLIC_API_URL 값을 쓰고, 없으면 localhost:8080
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// 백엔드에 GET 요청을 보낸다.
// 서버에 아예 연결이 안 되면 (서버 꺼짐, 주소 틀림, CORS 차단 등) 화면에 보여줄 한국어 메시지로 Error 를 던진다.
async function fetchFromServer(path: string): Promise<Response> {
  try {
    return await fetch(API_URL + path);
  } catch {
    throw new Error("서버에 연결할 수 없습니다. 백엔드 서버가 켜져 있는지 확인해 주세요.");
  }
}

// 백엔드에 GET 요청을 보내고 JSON 응답을 돌려준다. 서버가 에러(4xx, 5xx)를 돌려주면 Error 를 던진다.
async function apiGet<T>(path: string): Promise<T> {
  const response = await fetchFromServer(path);
  if (!response.ok) {
    throw new Error(`서버 오류가 발생했습니다. (${response.status})`);
  }
  return response.json();
}

// 실제 네트워크처럼 느껴지도록 300ms 기다린다
function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 배열에서 가장 큰 id + 1 (DB 의 자동 증가 id 흉내)
function nextId(rows: { id: number }[]) {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

// 배송지 주소: 로그인했으면 그 회원의 기본 배송지, 아니면 기본 mock 회원(정현서, 서울)의 기본 배송지
function getDeliveryAddress(): string {
  const userId = getSessionUserId() ?? users[0].id;
  const address =
    addresses.find((a) => a.userId === userId && a.isDefault) ??
    addresses.find((a) => a.userId === users[0].id && a.isDefault);
  return address ? address.address : "서울";
}

// 상품 1개에 카테고리 이름, 물류센터별 재고, 출고 센터, 예상 도착일을 붙인다
// (백엔드에서는 JOIN + lib/stock.ts 의 계산 규칙으로 처리할 부분)
function toProductWithStock(product: Product): ProductWithStock {
  const category = categories.find((c) => c.id === product.categoryId);
  return addStockInfo(product, category ? category.name : "");
}

// 상품 1개에 (mock) 재고 정보를 붙인다. 카테고리 이름은 밖에서 받아온다.
// 백엔드에서 받은 상품도 이 함수로 재고를 붙인다 (재고 API 가 생기기 전까지 임시)
function addStockInfo(product: Product, categoryName: string): ProductWithStock {
  const destinationRegion = getRegionFromAddress(getDeliveryAddress());

  // 1. 이 상품을 취급하는 물류센터별 판매가능재고
  const rows: { warehouse: Warehouse; availableQuantity: number }[] = [];
  for (const row of inventory) {
    if (row.productId !== product.id) continue;
    const warehouse = warehouses.find((w) => w.id === row.warehouseId);
    if (!warehouse) continue;
    rows.push({
      warehouse,
      availableQuantity: getAvailableQuantity(row.quantity, row.reservedQuantity),
    });
  }

  // 2. 배송지에서 가까운 센터가 앞에 오도록 정렬
  rows.sort(
    (a, b) =>
      getDistanceRank(destinationRegion, a.warehouse.region) -
      getDistanceRank(destinationRegion, b.warehouse.region)
  );

  const stocks: ProductStock[] = rows.map((row) => ({
    warehouseId: row.warehouse.id,
    warehouseName: row.warehouse.name,
    availableQuantity: row.availableQuantity,
  }));
  const totalStock = stocks.reduce((sum, stock) => sum + stock.availableQuantity, 0);

  // 3. 출고 센터 = 가까운 순서대로 봤을 때 처음으로 재고가 있는 센터
  const shippingRow = rows.find((row) => row.availableQuantity > 0);

  return {
    ...product,
    categoryName,
    stocks,
    totalStock,
    stockStatus: getStockStatus(totalStock),
    shippingWarehouse: shippingRow
      ? stocks.find((stock) => stock.warehouseId === shippingRow.warehouse.id)!
      : null,
    sameDayShipping: shippingRow ? shippingRow.warehouse.sameDayShipping : false,
    estimatedArrivalDate: shippingRow
      ? toDateKey(
          getEstimatedArrivalDate(
            shippingRow.warehouse.region,
            shippingRow.warehouse.sameDayShipping,
            destinationRegion
          )
        )
      : null,
  };
}

// 주문 1건의 주문 상품 목록에 상품 이름을 붙인다
function getOrderItems(orderId: number): OrderItemWithProduct[] {
  return orderItems
    .filter((item) => item.orderId === orderId)
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return { ...item, productName: product ? product.name : "(삭제된 상품)" };
    });
}

// ───────── 회원 / 로그인 ─────────

// 나중에: POST /api/auth/login
// 지금은 역할(고객/관리자)만 고르면 그 역할의 첫 번째 회원으로 로그인된다
export async function login(role: UserRole): Promise<User> {
  await delay();
  const user = users.find((u) => u.role === role);
  if (!user) throw new Error("해당 역할의 회원이 없습니다.");
  localStorage.setItem(SESSION_KEY, String(user.id));
  return user;
}

// 나중에: POST /api/auth/logout
export async function logout(): Promise<void> {
  await delay();
  localStorage.removeItem(SESSION_KEY);
}

// 나중에: GET /api/users/me
// 로그인하지 않았으면 null
export async function getCurrentUser(): Promise<User | null> {
  await delay();
  return users.find((u) => u.id === getSessionUserId()) ?? null;
}

// ───────── 카테고리 / 상품 ─────────

// 나중에: GET /api/categories
export async function getCategories(): Promise<Category[]> {
  await delay();
  return categories;
}

// 백엔드 상품 응답을 화면용 ProductWithStock 으로 바꾼다
// - 상품 정보(이름, 가격, 카테고리 이름 등)는 백엔드 값을 쓴다
// - 재고·출고 센터·도착일은 아직 백엔드에 없어서 mock 재고(mocks/inventory.ts)를 상품 id 로 찾아 붙인다
function fromProductResponse(response: ProductResponse): ProductWithStock {
  // 백엔드는 createdAt 을 시간대 없이 보낸다 ("2026-08-05T09:00:00").
  // mock 데이터와 같은 모양이 되도록 한국 시간(+09:00)을 붙인다. 이미 시간대가 있으면 그대로 둔다.
  const hasTimeZone = response.createdAt.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(response.createdAt);
  const createdAt = hasTimeZone ? response.createdAt : response.createdAt + "+09:00";

  const product: Product = {
    id: response.id,
    categoryId: response.categoryId,
    name: response.name,
    description: response.description,
    price: response.price,
    optionName: response.optionName,
    imageUrl: response.imageUrl,
    createdAt,
  };
  return addStockInfo(product, response.categoryName);
}

// [백엔드 연결됨] GET /api/products?categoryId=...
// 백엔드는 아직 categoryId 필터만 지원한다.
// 검색어(keyword)와 정렬(sort)은 백엔드에 생길 때까지 여기서 처리한다.
export async function getProducts(params: ProductSearchParams = {}): Promise<ProductWithStock[]> {
  const path = params.categoryId ? `/api/products?categoryId=${params.categoryId}` : "/api/products";
  const responses = await apiGet<ProductResponse[]>(path);
  let result = responses.map(fromProductResponse);

  // 검색어: 상품 이름에 포함되어 있는지
  const keyword = params.keyword?.trim();
  if (keyword) {
    result = result.filter((p) => p.name.includes(keyword));
  }

  // 정렬
  const sort = params.sort ?? "NEWEST";
  result.sort((a, b) => {
    if (sort === "PRICE_ASC") return a.price - b.price;
    if (sort === "PRICE_DESC") return b.price - a.price;
    if (sort === "NAME") return a.name.localeCompare(b.name, "ko");
    return b.createdAt.localeCompare(a.createdAt); // NEWEST: 최신 등록 순
  });

  return result;
}

// [백엔드 연결됨] GET /api/products/{id}
// 상품이 없으면 (백엔드가 404 를 돌려주면) null 을 돌려준다
export async function getProduct(id: number): Promise<ProductWithStock | null> {
  const response = await fetchFromServer(`/api/products/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`서버 오류가 발생했습니다. (${response.status})`);
  }
  const data: ProductResponse = await response.json();
  return fromProductResponse(data);
}

// 나중에: GET /api/products?ids=1,2,3
// 장바구니 화면용: 담긴 상품들의 최신 재고·출고 센터·도착일·이미지를 한 번에 가져온다
// 없는(삭제된) 상품은 결과에서 빠진다
export async function getProductsByIds(ids: number[]): Promise<ProductWithStock[]> {
  await delay();
  return products.filter((p) => ids.includes(p.id)).map(toProductWithStock);
}

// 나중에: POST /api/products/{id}/restock-alerts
// 품절 상품의 재입고 알림을 신청한다. 이미 신청했으면 기존 신청을 그대로 돌려준다.
export async function requestRestockAlert(productId: number): Promise<RestockAlert> {
  await delay();
  const user = requireLogin();

  if (!products.some((p) => p.id === productId)) {
    throw new Error("존재하지 않는 상품입니다.");
  }

  const existing = restockAlerts.find((a) => a.userId === user.id && a.productId === productId);
  if (existing) return existing;

  const alert: RestockAlert = {
    id: nextId(restockAlerts),
    userId: user.id,
    productId,
    createdAt: new Date().toISOString(),
  };
  restockAlerts.push(alert);
  return alert;
}

// ───────── 주문 ─────────

// 나중에: POST /api/orders
// 주문(orders) + 주문 상품(order_items) + 배송(shipments) + 첫 배송 이력(shipment_events)을 만든다.
// 주의: mock 데이터는 브라우저 메모리에만 저장되므로 새로고침하면 사라진다.
export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  await delay();
  const user = requireLogin();

  if (request.items.length === 0) {
    throw new Error("주문할 상품이 없습니다.");
  }

  // 1. 상품 확인 + 재고 확인 + 총 금액 계산 (가격은 화면이 아니라 여기서 계산한다)
  let totalPrice = 0;
  for (const item of request.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error("존재하지 않는 상품이 있습니다.");
    }
    const { totalStock } = toProductWithStock(product);
    if (item.quantity > totalStock) {
      throw new Error(`${product.name}의 재고가 부족합니다. (남은 수량: ${totalStock}개)`);
    }
    totalPrice += product.price * item.quantity;
  }
  // 배송비 (상품금액이 무료배송 기준보다 적으면 추가)
  totalPrice += getShippingFee(totalPrice);

  const now = new Date().toISOString();

  // 2. orders
  const order: Order = {
    id: nextId(orders),
    userId: user.id,
    status: "PAID",
    paymentMethod: request.paymentMethod,
    totalPrice,
    receiverName: request.receiverName,
    receiverPhone: request.receiverPhone,
    address: request.address,
    createdAt: now,
  };
  orders.push(order);

  // 3. order_items
  for (const item of request.items) {
    const product = products.find((p) => p.id === item.productId)!;
    orderItems.push({
      id: nextId(orderItems),
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
    });
  }

  // 4. shipments: 첫 번째 상품의 출고 센터(배송지에서 가장 가까운 재고 있는 센터)에서 출고한다 (단순화한 규칙)
  const firstProduct = toProductWithStock(
    products.find((p) => p.id === request.items[0].productId)!
  );
  const shippingWarehouse = firstProduct.shippingWarehouse!; // 위에서 재고를 확인했으므로 항상 있다
  const warehouseId = shippingWarehouse.warehouseId;
  const shipmentId = nextId(shipments);
  shipments.push({
    id: shipmentId,
    orderId: order.id,
    warehouseId,
    courier: "CJ대한통운",
    trackingNumber: null,
    status: "PREPARING",
    shippedAt: null,
    deliveredAt: null,
  });

  // 5. shipment_events: 첫 배송 이력
  shipmentEvents.push({
    id: nextId(shipmentEvents),
    shipmentId,
    status: "PREPARING",
    location: shippingWarehouse.warehouseName,
    description: "주문이 접수되어 상품을 준비하고 있습니다.",
    occurredAt: now,
  });

  return order;
}

// 나중에: GET /api/orders/me
// 로그인한 회원의 주문 목록 (최신 주문이 위로)
export async function getMyOrders(): Promise<OrderWithDetails[]> {
  await delay();
  const user = requireLogin();

  return orders
    .filter((order) => order.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((order) => ({
      ...order,
      items: getOrderItems(order.id),
      shipment: shipments.find((s) => s.orderId === order.id) ?? null,
    }));
}

// ───────── 배송 ─────────

// 나중에: GET /api/shipments/{id}
// 배송이 없으면 null (백엔드에서는 404)
export async function getShipment(id: number): Promise<ShipmentDetail | null> {
  await delay();

  const shipment = shipments.find((s) => s.id === id);
  if (!shipment) return null;

  const order = orders.find((o) => o.id === shipment.orderId);
  if (!order) return null;

  const warehouse = warehouses.find((w) => w.id === shipment.warehouseId);
  const events = shipmentEvents
    .filter((e) => e.shipmentId === shipment.id)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  return {
    ...shipment,
    warehouseName: warehouse ? warehouse.name : "",
    events,
    order,
    items: getOrderItems(order.id),
  };
}

// ───────── 마이페이지 ─────────

// 나중에: GET /api/users/me/summary
export async function getMyPageSummary(): Promise<MyPageSummary> {
  await delay();
  const user = requireLogin();

  return {
    shippingCount: orders.filter((o) => o.userId === user.id && o.status === "SHIPPING").length,
    claimInProgressCount: orderClaims.filter(
      (c) => c.userId === user.id && (c.status === "REQUESTED" || c.status === "IN_PROGRESS")
    ).length,
    restockAlertCount: restockAlerts.filter((a) => a.userId === user.id).length,
  };
}

// 나중에: GET /api/users/me/claims?types=CANCEL (취소) / ?types=RETURN,EXCHANGE (반품·교환)
// 최근 신청이 위로
export async function getMyClaims(types: ClaimType[]): Promise<ClaimWithOrder[]> {
  await delay();
  const user = requireLogin();

  const result: ClaimWithOrder[] = [];
  for (const claim of orderClaims) {
    if (claim.userId !== user.id || !types.includes(claim.type)) continue;
    const order = orders.find((o) => o.id === claim.orderId);
    if (!order) continue;
    result.push({ ...claim, order, items: getOrderItems(order.id) });
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// 나중에: GET /api/users/me/restock-alerts
export async function getMyRestockAlerts(): Promise<RestockAlertWithProduct[]> {
  await delay();
  const user = requireLogin();

  const result: RestockAlertWithProduct[] = [];
  for (const alert of restockAlerts) {
    if (alert.userId !== user.id) continue;
    const product = products.find((p) => p.id === alert.productId);
    if (!product) continue;
    result.push({ ...alert, product: toProductWithStock(product) });
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// 나중에: DELETE /api/users/me/restock-alerts/{id}
export async function deleteRestockAlert(alertId: number): Promise<void> {
  await delay();
  const user = requireLogin();

  const index = restockAlerts.findIndex((a) => a.id === alertId && a.userId === user.id);
  if (index === -1) throw new Error("알림 신청 내역을 찾을 수 없습니다.");
  restockAlerts.splice(index, 1);
}

// ───────── 내 정보 ─────────

// 나중에: POST /api/users/me/verify-password
// 비밀번호가 틀리면 에러 (백엔드에서는 401. 맞으면 잠깐 동안만 쓸 수 있는 확인 토큰을 발급한다)
export async function verifyPassword(password: string): Promise<void> {
  await delay();
  const user = requireLogin();

  const saved = userPasswords.find((p) => p.userId === user.id);
  if (!saved || saved.password !== password) {
    throw new Error("비밀번호가 일치하지 않습니다.");
  }
}

// 나중에: PATCH /api/users/me
// 이름, 전화번호, (선택) 비밀번호를 바꾼다. 이메일은 바꿀 수 없다.
export async function updateMyProfile(request: UpdateProfileRequest): Promise<User> {
  await delay();
  const user = requireLogin();

  // 화면에서 검사했더라도 서버에서 한 번 더 검사한다
  if (!isValidName(request.name)) throw new Error("이름을 1~20자로 입력해 주세요.");
  if (!isValidPhone(request.phone)) throw new Error("전화번호 형식이 올바르지 않습니다.");
  if (request.newPassword !== undefined && !isValidPassword(request.newPassword)) {
    throw new Error("비밀번호는 8자 이상이어야 합니다.");
  }

  user.name = request.name.trim();
  user.phone = request.phone;

  if (request.newPassword !== undefined) {
    const saved = userPasswords.find((p) => p.userId === user.id);
    if (saved) saved.password = request.newPassword;
  }
  return user;
}

// ───────── 배송지 ─────────

// 배송지 입력값 검사 (추가/수정 공통)
function checkAddressRequest(request: AddressRequest) {
  if (!request.label.trim()) throw new Error("배송지 이름을 입력해 주세요.");
  if (!isValidName(request.receiverName)) throw new Error("받는 사람을 1~20자로 입력해 주세요.");
  if (!isValidPhone(request.receiverPhone)) throw new Error("전화번호 형식이 올바르지 않습니다.");
  if (!request.address.trim()) throw new Error("주소를 입력해 주세요.");
}

// 이 회원의 기본 배송지를 addressId 하나로 바꾼다 (나머지는 기본 해제)
function makeDefault(userId: number, addressId: number) {
  for (const address of addresses) {
    if (address.userId === userId) address.isDefault = address.id === addressId;
  }
}

// 나중에: GET /api/users/me/addresses
// 기본 배송지가 맨 위, 나머지는 등록한 순서
export async function getMyAddresses(): Promise<Address[]> {
  await delay();
  const user = requireLogin();

  return addresses
    .filter((a) => a.userId === user.id)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id);
}

// 나중에: POST /api/users/me/addresses
// 첫 배송지는 자동으로 기본 배송지가 된다
export async function createAddress(request: AddressRequest): Promise<Address> {
  await delay();
  const user = requireLogin();
  checkAddressRequest(request);

  const isFirst = !addresses.some((a) => a.userId === user.id);
  const address: Address = {
    id: nextId(addresses),
    userId: user.id,
    label: request.label.trim(),
    receiverName: request.receiverName.trim(),
    receiverPhone: request.receiverPhone,
    address: request.address.trim(),
    isDefault: false,
  };
  addresses.push(address);
  if (request.isDefault || isFirst) makeDefault(user.id, address.id);
  return address;
}

// 나중에: PUT /api/users/me/addresses/{id}
// 기본 배송지 해제는 여기서 하지 않는다 (다른 배송지를 기본으로 설정하면 자동으로 해제된다)
export async function updateAddress(addressId: number, request: AddressRequest): Promise<Address> {
  await delay();
  const user = requireLogin();
  checkAddressRequest(request);

  const address = addresses.find((a) => a.id === addressId && a.userId === user.id);
  if (!address) throw new Error("배송지를 찾을 수 없습니다.");

  address.label = request.label.trim();
  address.receiverName = request.receiverName.trim();
  address.receiverPhone = request.receiverPhone;
  address.address = request.address.trim();
  if (request.isDefault) makeDefault(user.id, address.id);
  return address;
}

// 나중에: PATCH /api/users/me/addresses/{id}/default
export async function setDefaultAddress(addressId: number): Promise<void> {
  await delay();
  const user = requireLogin();

  if (!addresses.some((a) => a.id === addressId && a.userId === user.id)) {
    throw new Error("배송지를 찾을 수 없습니다.");
  }
  makeDefault(user.id, addressId);
}

// 나중에: DELETE /api/users/me/addresses/{id}
// 기본 배송지를 지우면 남은 배송지 중 가장 먼저 등록한 것이 기본 배송지가 된다
export async function deleteAddress(addressId: number): Promise<void> {
  await delay();
  const user = requireLogin();

  const index = addresses.findIndex((a) => a.id === addressId && a.userId === user.id);
  if (index === -1) throw new Error("배송지를 찾을 수 없습니다.");

  const wasDefault = addresses[index].isDefault;
  addresses.splice(index, 1);

  if (wasDefault) {
    const next = addresses.find((a) => a.userId === user.id);
    if (next) makeDefault(user.id, next.id);
  }
}

// ───────── AI 도우미 ─────────

// 나중에: POST /api/ai/chat
// 지금은 진짜 AI 가 아니라, 정해진 규칙으로 답하는 가짜 AI 다. (1초 뒤 답변)
export async function askAi(request: AiChatRequest): Promise<AiChatResponse> {
  await delay(1000);

  // "배송" 이라는 단어가 없으면 안내 문구로 답한다
  if (!request.message.includes("배송")) {
    return {
      reply:
        "죄송해요, 지금은 배송 관련 질문만 답변할 수 있어요.\n예: \"내 배송 어디쯤이야?\"",
    };
  }

  const user = users.find((u) => u.id === getSessionUserId());
  if (!user) {
    return { reply: "로그인하시면 주문하신 상품의 배송 현황을 알려드릴게요." };
  }

  const myOrders = orders
    .filter((order) => order.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (myOrders.length === 0) {
    return { reply: `${user.name}님은 아직 주문하신 상품이 없어요.` };
  }

  // 주문마다 한 줄씩: 주문 번호, 대표 상품, 배송 상태, 마지막 위치
  const lines = myOrders.map((order) => {
    const items = getOrderItems(order.id);
    const title =
      items.length > 1 ? `${items[0].productName} 외 ${items.length - 1}건` : items[0]?.productName;

    const shipment = shipments.find((s) => s.orderId === order.id);
    if (!shipment) {
      return `- 주문 ${order.id}번 (${title}): ${orderStatusLabel[order.status]}`;
    }

    const events = shipmentEvents.filter((e) => e.shipmentId === shipment.id);
    const lastEvent = events[events.length - 1];
    const where = lastEvent ? ` · ${lastEvent.location}` : "";
    return `- 주문 ${order.id}번 (${title}): ${shipmentStatusLabel[shipment.status]}${where}`;
  });

  return {
    reply: `${user.name}님의 배송 현황이에요.\n${lines.join("\n")}\n\n자세한 이력은 '배송조회' 메뉴에서 확인하실 수 있어요.`,
  };
}

// ───────── 관리자 ─────────
// 관리자 함수는 모두 관리자로 로그인했을 때만 동작한다 (백엔드에서도 권한을 확인할 부분)

// 재고가 LOW_STOCK_THRESHOLD(lib/stock.ts) 보다 적으면 "재고 부족"
// 주문 후 이 일수가 지나도 배송 완료가 아니면 "지연 배송"
const DELAY_DAYS = 3;

function requireAdmin(): User {
  const user = requireLogin();
  if (user.role !== "ADMIN") throw new Error("관리자만 사용할 수 있습니다.");
  return user;
}

function isDelayed(shipment: Shipment): boolean {
  if (shipment.status === "DELIVERED") return false;
  const order = orders.find((o) => o.id === shipment.orderId);
  if (!order || order.status === "CANCELLED") return false;
  const days = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > DELAY_DAYS;
}

function toAdminShipment(shipment: Shipment): AdminShipment {
  const order = orders.find((o) => o.id === shipment.orderId)!;
  const warehouse = warehouses.find((w) => w.id === shipment.warehouseId);
  const events = shipmentEvents
    .filter((e) => e.shipmentId === shipment.id)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  return {
    ...shipment,
    warehouseName: warehouse ? warehouse.name : "",
    orderStatus: order.status,
    receiverName: order.receiverName,
    address: order.address,
    lastEvent: events[events.length - 1] ?? null,
    delayed: isDelayed(shipment),
  };
}

// 나중에: GET /api/admin/dashboard
export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay();
  requireAdmin();

  // 최근 7일 (오늘 포함) 날짜별 주문 수
  const dailyOrders: DailyOrderCount[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const key = toDateKey(day);
    const count = orders.filter((o) => toDateKey(new Date(o.createdAt)) === key).length;
    dailyOrders.push({ date: key, count });
  }

  return {
    totalOrders: orders.length,
    shippingCount: shipments.filter((s) => s.status === "SHIPPED" || s.status === "IN_TRANSIT").length,
    lowStockCount: inventory.filter((row) => row.quantity < LOW_STOCK_THRESHOLD).length,
    delayedCount: shipments.filter(isDelayed).length,
    dailyOrders,
  };
}

// 나중에: GET /api/admin/orders?status=...
// status 를 주지 않으면 전체 주문
export async function getAdminOrders(status?: OrderStatus): Promise<AdminOrder[]> {
  await delay();
  requireAdmin();

  return orders
    .filter((order) => !status || order.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((order) => ({
      ...order,
      userName: users.find((u) => u.id === order.userId)?.name ?? "(탈퇴 회원)",
      items: getOrderItems(order.id),
      shipment: shipments.find((s) => s.orderId === order.id) ?? null,
    }));
}

// 관리자가 주문 화면에서 바꿀 수 있는 상태 (현재 상태 → 바꿀 수 있는 상태들)
// 배송중/배송 완료는 배송 관리 화면에서 배송 상태를 바꾸면 자동으로 따라 바뀐다
export const orderStatusChanges: Record<OrderStatus, OrderStatus[]> = {
  PAID: ["PREPARING", "CANCELLED"],
  PREPARING: ["CANCELLED"],
  SHIPPING: [],
  DELIVERED: [],
  CANCELLED: [],
};

// 나중에: PATCH /api/admin/orders/{id}/status
export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
  await delay();
  requireAdmin();

  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("주문을 찾을 수 없습니다.");
  if (!orderStatusChanges[order.status].includes(status)) {
    throw new Error(
      `'${orderStatusLabel[order.status]}' 상태에서는 '${orderStatusLabel[status]}'(으)로 바꿀 수 없습니다.`
    );
  }

  order.status = status;
  return order;
}

// 나중에: GET /api/admin/inventory
export async function getInventoryTable(): Promise<InventoryTable> {
  await delay();
  requireAdmin();

  const rows: InventoryRow[] = products.map((product) => {
    const cells: InventoryCell[] = warehouses.map((warehouse) => {
      const row = inventory.find(
        (r) => r.productId === product.id && r.warehouseId === warehouse.id
      );
      // 이 물류센터에서 취급하지 않는 상품
      if (!row) return { warehouseId: warehouse.id, quantity: null, lowStock: false };

      return {
        warehouseId: warehouse.id,
        quantity: row.quantity,
        lowStock: row.quantity < LOW_STOCK_THRESHOLD,
      };
    });

    return {
      productId: product.id,
      productName: product.name,
      categoryName: categories.find((c) => c.id === product.categoryId)?.name ?? "",
      cells,
      totalQuantity: cells.reduce((sum, cell) => sum + (cell.quantity ?? 0), 0),
    };
  });

  return { warehouses, rows, lowStockThreshold: LOW_STOCK_THRESHOLD };
}

// 나중에: GET /api/admin/shipments?status=...
export async function getAdminShipments(status?: ShipmentStatus): Promise<AdminShipment[]> {
  await delay();
  requireAdmin();

  return shipments
    .filter((s) => !status || s.status === status)
    .sort((a, b) => b.id - a.id)
    .map(toAdminShipment);
}

// 배송 상태의 다음 단계 (이미 마지막 단계면 null)
export function getNextShipmentStatus(status: ShipmentStatus): ShipmentStatus | null {
  const index = shipmentSteps.indexOf(status);
  return shipmentSteps[index + 1] ?? null;
}

// 나중에: PATCH /api/admin/shipments/{id}/status
// 배송 상태를 한 단계 진행하고, 배송 이력을 남기고, 주문 상태도 함께 바꾼다
export async function updateShipmentStatus(
  shipmentId: number,
  status: ShipmentStatus
): Promise<AdminShipment> {
  await delay();
  requireAdmin();

  const shipment = shipments.find((s) => s.id === shipmentId);
  if (!shipment) throw new Error("배송 정보를 찾을 수 없습니다.");
  const order = orders.find((o) => o.id === shipment.orderId)!;
  if (order.status === "CANCELLED") {
    throw new Error("취소된 주문은 배송 상태를 바꿀 수 없습니다.");
  }
  if (getNextShipmentStatus(shipment.status) !== status) {
    throw new Error("배송 상태는 한 단계씩만 진행할 수 있습니다.");
  }

  const now = new Date().toISOString();
  const warehouse = warehouses.find((w) => w.id === shipment.warehouseId);
  let location = "";
  let description = "";

  if (status === "SHIPPED") {
    shipment.shippedAt = now;
    shipment.trackingNumber = String(500000000000 + shipment.id); // 가짜 운송장 번호
    order.status = "SHIPPING";
    location = warehouse ? warehouse.name : "";
    description = "상품이 출고되었습니다.";
  } else if (status === "IN_TRANSIT") {
    location = "허브터미널";
    description = "간선 이동 중입니다.";
  } else if (status === "DELIVERED") {
    shipment.deliveredAt = now;
    order.status = "DELIVERED";
    location = order.address;
    description = "배송이 완료되었습니다.";
  }
  shipment.status = status;

  shipmentEvents.push({
    id: nextId(shipmentEvents),
    shipmentId: shipment.id,
    status,
    location,
    description,
    occurredAt: now,
  });

  return toAdminShipment(shipment);
}
