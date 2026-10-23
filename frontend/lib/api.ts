// 화면은 반드시 이 파일의 함수만 호출한다.
// 모든 함수는 백엔드(Spring Boot) REST API 를 호출한다. (API 목록: ../docs/API.md)

import type {
  AdminShipment,
  AdminUser,
  Analytics,
  DashboardSummary,
  InventoryCell,
  InventoryRow,
  InventoryTable,
  Page,
} from "@/types/admin";
import type { AiChatRequest, AiChatResponse } from "@/types/ai";
import type { Cart } from "@/types/cart";
import type { Claim, ClaimType } from "@/types/claim";
import type { CancelOrderResponse, CreateOrderRequest, Order, OrderStatus } from "@/types/order";
import type {
  Category,
  Product,
  ProductRequest,
  ProductResponse,
  ProductSearchParams,
  ProductStock,
  ProductWithStock,
  RestockAlert,
  RestockAlertResponse,
} from "@/types/product";
import type { ShipmentStatus, Tracking } from "@/types/shipment";
import type {
  Address,
  AddressRequest,
  ChangePasswordRequest,
  LoginResponse,
  MyPageSummary,
  SignupRequest,
  UpdateProfileRequest,
  User,
} from "@/types/user";
import type { InventoryResponse, Warehouse, WarehouseRegion } from "@/types/warehouse";
import { toDateKey } from "@/lib/format";
import {
  LOW_STOCK_THRESHOLD,
  getAvailableQuantity,
  getDistanceRank,
  getEstimatedArrivalDate,
  getRegionFromAddress,
  getStockStatus,
} from "@/lib/stock";

// ───────── 공통: 백엔드 호출 ─────────

// 백엔드 주소. .env.local 의 NEXT_PUBLIC_API_URL 값을 쓰고, 없으면 localhost:8080
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// 로그인 토큰(JWT)을 브라우저 localStorage 에 저장해 두고, 요청마다 Authorization 헤더로 보낸다
const TOKEN_KEY = "logistics_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null; // 서버에서 실행될 때는 localStorage 가 없다
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

// 백엔드 에러 응답 { code, message } 를 담는 에러. 화면에서는 error.message 를 그대로 보여주면 된다
export class ApiError extends Error {
  status: number; // HTTP 상태 코드 (서버에 연결조차 못 했으면 0)
  code: string; // 예: "OUT_OF_STOCK", "DUPLICATE_EMAIL"

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// 백엔드에 요청을 보내고 JSON 응답을 돌려준다
// - body 가 FormData 면 그대로(파일 업로드), 객체면 JSON 으로 보낸다
// - 실패하면 ApiError 를 던진다 (메시지는 백엔드가 보낸 한국어 메시지)
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // Content-Type 은 브라우저가 알아서 정한다 (multipart/form-data)
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    // cache: "no-store" → 저장해 둔 응답을 쓰지 않고 항상 서버에서 최신 값을 받아온다 (재고는 자주 바뀐다)
    response = await fetch(API_URL + path, { method, headers, body: payload, cache: "no-store" });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "서버에 연결할 수 없습니다. 백엔드 서버가 켜져 있는지 확인해 주세요.");
  }

  if (!response.ok) {
    // 토큰이 만료되었거나 잘못되었으면 지운다 (다음 화면부터 로그인 안 한 상태가 된다)
    if (response.status === 401 && token) clearToken();

    let code = `HTTP_${response.status}`;
    let message = `서버 오류가 발생했습니다. (${response.status})`;
    try {
      const error = await response.json();
      code = error.code ?? code;
      message = error.message ?? message;
    } catch {
      // 본문이 JSON 이 아니면 기본 메시지를 쓴다
    }
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) return undefined as T; // 본문 없음 (삭제 등)
  return response.json();
}

const get = <T>(path: string) => request<T>("GET", path);
const post = <T>(path: string, body?: unknown) => request<T>("POST", path, body);
const put = <T>(path: string, body: unknown) => request<T>("PUT", path, body);
const patch = <T>(path: string, body: unknown) => request<T>("PATCH", path, body);
const del = <T>(path: string) => request<T>("DELETE", path);

// 404 면 null 을 돌려준다 (상품·주문이 없을 때 "찾을 수 없습니다" 화면을 보여주기 위해)
async function getOrNull<T>(path: string): Promise<T | null> {
  try {
    return await get<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// 상품 이미지 주소: 백엔드에 올린 사진은 "/uploads/..." 로 오므로 백엔드 주소를 붙인다
export function imageSrc(imageUrl: string): string {
  return imageUrl.startsWith("/") ? API_URL + imageUrl : imageUrl;
}

// ───────── 회원 / 로그인 ─────────

// POST /api/auth/login → 토큰을 저장하고 회원 정보를 돌려준다
export async function login(email: string, password: string): Promise<User> {
  const response = await post<LoginResponse>("/api/auth/login", { email, password });
  localStorage.setItem(TOKEN_KEY, response.accessToken);
  return response.user;
}

// 로그아웃: JWT 는 서버에 저장하지 않으므로 브라우저에서 토큰만 지우면 된다
export async function logout(): Promise<void> {
  clearToken();
}

// POST /api/auth/signup (가입만 한다. 로그인은 login 을 따로 부른다)
export async function signup(request: SignupRequest): Promise<User> {
  return post<User>("/api/auth/signup", request);
}

// GET /api/auth/me. 로그인하지 않았거나 토큰이 만료되었으면 null
export async function getCurrentUser(): Promise<User | null> {
  if (!getToken()) return null;
  try {
    return await get<User>("/api/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

// ───────── 카테고리 / 상품 ─────────

// GET /api/categories
export async function getCategories(): Promise<Category[]> {
  return get<Category[]>("/api/categories");
}

// 예상 도착일 계산에 쓸 배송지 지역: 로그인했으면 기본 배송지, 아니면(또는 배송지가 없으면) 서울
async function getDeliveryRegion(): Promise<WarehouseRegion> {
  if (!getToken()) return "SEOUL";
  try {
    const addresses = await getMyAddresses();
    const address = addresses.find((a) => a.isDefault);
    return address ? getRegionFromAddress(address.address) : "SEOUL";
  } catch {
    return "SEOUL";
  }
}

// 상품 1개에 물류센터별 재고, 출고 센터, 예상 도착일을 붙인다
// - 재고 합계(totalStock)는 백엔드가 계산해 준 값을 쓰고, 재고 상태는 lib/stock.ts 규칙으로 판단한다
// - 출고 센터·도착일은 백엔드에서 받은 재고 목록과 물류센터 목록으로 계산한다
function toProductWithStock(
  response: ProductResponse,
  inventories: InventoryResponse[],
  warehouseList: Warehouse[],
  destinationRegion: WarehouseRegion
): ProductWithStock {
  // 백엔드는 createdAt 을 시간대 없이 보낸다 ("2026-08-05T09:00:00", 한국 시간). 정렬이 정확하도록 +09:00 을 붙인다
  const hasTimeZone = response.createdAt.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(response.createdAt);
  const product: Product = {
    id: response.id,
    categoryId: response.categoryId,
    name: response.name,
    description: response.description,
    price: response.price,
    optionName: response.optionName,
    imageUrl: response.imageUrl,
    createdAt: hasTimeZone ? response.createdAt : response.createdAt + "+09:00",
  };

  // 1. 이 상품을 취급하는 물류센터별 판매가능재고
  const rows: { warehouse: Warehouse; availableQuantity: number }[] = [];
  for (const row of inventories) {
    if (row.productId !== product.id) continue;
    const warehouse = warehouseList.find((w) => w.id === row.warehouseId);
    if (!warehouse) continue;
    rows.push({ warehouse, availableQuantity: getAvailableQuantity(row.quantity, row.reservedQuantity) });
  }

  // 2. 배송지에서 가까운 센터가 앞에 오도록 정렬
  rows.sort(
    (a, b) =>
      getDistanceRank(destinationRegion, a.warehouse.region) - getDistanceRank(destinationRegion, b.warehouse.region)
  );

  const stocks: ProductStock[] = rows.map((row) => ({
    warehouseId: row.warehouse.id,
    warehouseName: row.warehouse.name,
    availableQuantity: row.availableQuantity,
  }));
  // 3. 출고 센터 = 가까운 순서대로 봤을 때 처음으로 재고가 있는 센터
  const shippingRow = rows.find((row) => row.availableQuantity > 0);

  return {
    ...product,
    categoryName: response.categoryName,
    stocks,
    totalStock: response.totalStock,
    stockStatus: getStockStatus(response.totalStock),
    shippingWarehouse: shippingRow ? stocks.find((s) => s.warehouseId === shippingRow.warehouse.id)! : null,
    sameDayShipping: shippingRow ? shippingRow.warehouse.sameDayShipping : false,
    estimatedArrivalDate: shippingRow
      ? toDateKey(
          getEstimatedArrivalDate(shippingRow.warehouse.region, shippingRow.warehouse.sameDayShipping, destinationRegion)
        )
      : null,
  };
}

// 상품 응답 여러 개를 화면용으로 바꾼다 (재고·물류센터·배송지 지역을 한 번씩만 불러온다)
async function toProductsWithStock(responses: ProductResponse[]): Promise<ProductWithStock[]> {
  const [inventories, warehouseList, region] = await Promise.all([
    getInventories(),
    getWarehouses(),
    getDeliveryRegion(),
  ]);
  return responses.map((response) => toProductWithStock(response, inventories, warehouseList, region));
}

// GET /api/products?categoryId=...
// 검색어(keyword)와 정렬(sort)은 상품 수가 많지 않아 여기서 처리한다.
export async function getProducts(params: ProductSearchParams = {}): Promise<ProductWithStock[]> {
  const path = params.categoryId ? `/api/products?categoryId=${params.categoryId}` : "/api/products";
  let result = await toProductsWithStock(await get<ProductResponse[]>(path));

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

// GET /api/products/{id}. 상품이 없으면 null
export async function getProduct(id: number): Promise<ProductWithStock | null> {
  const response = await getOrNull<ProductResponse>(`/api/products/${id}`);
  if (!response) return null;

  const [inventories, warehouseList, region] = await Promise.all([
    get<InventoryResponse[]>(`/api/products/${id}/inventories`),
    getWarehouses(),
    getDeliveryRegion(),
  ]);
  return toProductWithStock(response, inventories, warehouseList, region);
}

// ───────── 물류센터 / 재고 ─────────

// GET /api/warehouses
export async function getWarehouses(): Promise<Warehouse[]> {
  return get<Warehouse[]>("/api/warehouses");
}

// GET /api/inventories (모든 상품 × 물류센터의 재고 목록. 상품 목록의 출고 센터 계산에 쓴다)
export async function getInventories(): Promise<InventoryResponse[]> {
  return get<InventoryResponse[]>("/api/inventories");
}

// ───────── 재입고 알림 ─────────

// POST /api/products/{id}/restock-alerts (로그인 필요. 이미 신청했으면 기존 신청을 그대로 돌려준다)
export async function requestRestockAlert(productId: number): Promise<void> {
  await post<RestockAlertResponse>(`/api/products/${productId}/restock-alerts`);
}

// GET /api/users/me/restock-alerts (최근 신청이 위로)
export async function getMyRestockAlerts(): Promise<RestockAlert[]> {
  const alerts = await get<RestockAlertResponse[]>("/api/users/me/restock-alerts");
  const products = await toProductsWithStock(alerts.map((alert) => alert.product));
  return alerts.map((alert, index) => ({ ...alert, product: products[index] }));
}

// DELETE /api/users/me/restock-alerts/{id}
export async function deleteRestockAlert(alertId: number): Promise<void> {
  await del<void>(`/api/users/me/restock-alerts/${alertId}`);
}

// ───────── 장바구니 (로그인 필요. 서버 cart_items 테이블에 저장된다) ─────────
// 바꾸는 API 는 모두 바뀐 장바구니 전체를 돌려준다

// GET /api/cart
export async function getCart(): Promise<Cart> {
  return get<Cart>("/api/cart");
}

// POST /api/cart/items (이미 담긴 상품이면 수량을 더한다. 재고보다 많으면 409)
export async function addCartItem(productId: number, quantity: number): Promise<Cart> {
  return post<Cart>("/api/cart/items", { productId, quantity });
}

// PATCH /api/cart/items/{productId}
export async function updateCartQuantity(productId: number, quantity: number): Promise<Cart> {
  return patch<Cart>(`/api/cart/items/${productId}`, { quantity });
}

// DELETE /api/cart/items?productIds=1,2
export async function removeCartItems(productIds: number[]): Promise<Cart> {
  return del<Cart>(`/api/cart/items?productIds=${productIds.join(",")}`);
}

// ───────── 주문 ─────────

// POST /api/orders: 장바구니에서 고른 상품으로 주문 (재고 예약 + 모의 결제가 한 번에 처리된다)
export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  return post<Order>("/api/orders", request);
}

// GET /api/orders (최신 주문이 위로)
export async function getMyOrders(): Promise<Order[]> {
  return get<Order[]>("/api/orders");
}

// POST /api/orders/{id}/cancel
// 출고 전이면 즉시 취소, 출고 후면 회수 요청, 이미 처리된 주문이면 아무 일도 하지 않는다
export async function cancelOrder(orderId: number, reason?: string): Promise<CancelOrderResponse> {
  return post<CancelOrderResponse>(`/api/orders/${orderId}/cancel`, reason ? { reason } : undefined);
}

// ───────── 배송 ─────────

// GET /api/orders/{id}/tracking: 배송 타임라인 + 도착 예상 시각. 내 주문이 아니거나 없으면 null
export async function getTracking(orderId: number): Promise<Tracking | null> {
  return getOrNull<Tracking>(`/api/orders/${orderId}/tracking`);
}

// ───────── 마이페이지 ─────────

// 마이페이지 요약 카드: 내 주문 목록 + 재입고 알림 목록으로 센다
export async function getMyPageSummary(): Promise<MyPageSummary> {
  const [orders, alerts] = await Promise.all([
    getMyOrders(),
    get<RestockAlertResponse[]>("/api/users/me/restock-alerts"),
  ]);
  return {
    shippingCount: orders.filter((o) => o.status === "SHIPPED" || o.status === "IN_TRANSIT").length,
    returningCount: orders.filter((o) => o.status === "RETURNING").length,
    restockAlertCount: alerts.length,
  };
}

// GET /api/users/me/claims?type=CANCEL (취소 내역) / RETURN (회수 내역). 최근 신청이 위로
export async function getMyClaims(type: ClaimType): Promise<Claim[]> {
  return get<Claim[]>(`/api/users/me/claims?type=${type}`);
}

// ───────── 내 정보 ─────────

// POST /api/users/me/verify-password (틀리면 401 → "비밀번호가 일치하지 않습니다.")
export async function verifyPassword(password: string): Promise<void> {
  await post<void>("/api/users/me/verify-password", { password });
}

// PUT /api/users/me (이름, 전화번호)
export async function updateMyProfile(request: UpdateProfileRequest): Promise<User> {
  return put<User>("/api/users/me", request);
}

// PATCH /api/users/me/password (현재 비밀번호가 틀리면 401)
export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  await patch<void>("/api/users/me/password", request);
}

// ───────── 배송지 ─────────

// GET /api/users/me/addresses (기본 배송지가 맨 위)
export async function getMyAddresses(): Promise<Address[]> {
  return get<Address[]>("/api/users/me/addresses");
}

// POST /api/users/me/addresses (첫 배송지는 자동으로 기본 배송지가 된다)
export async function createAddress(request: AddressRequest): Promise<Address> {
  return post<Address>("/api/users/me/addresses", request);
}

// PUT /api/users/me/addresses/{id}
export async function updateAddress(addressId: number, request: AddressRequest): Promise<Address> {
  return put<Address>(`/api/users/me/addresses/${addressId}`, request);
}

// PATCH /api/users/me/addresses/{id}/default
export async function setDefaultAddress(addressId: number): Promise<void> {
  await patch<Address>(`/api/users/me/addresses/${addressId}/default`, {});
}

// DELETE /api/users/me/addresses/{id} (기본 배송지를 지우면 가장 먼저 등록한 배송지가 기본이 된다)
export async function deleteAddress(addressId: number): Promise<void> {
  await del<void>(`/api/users/me/addresses/${addressId}`);
}

// ───────── AI 도우미 ─────────

// POST /api/assistant/chat (로그인했으면 토큰이 함께 가서 내 주문 기준으로 답한다)
export async function askAi(request: AiChatRequest): Promise<AiChatResponse> {
  return post<AiChatResponse>("/api/assistant/chat", request);
}

// ───────── 관리자 (/api/admin/**, 관리자만. 일반 회원이면 403) ─────────

// GET /api/admin/dashboard
export async function getDashboardSummary(): Promise<DashboardSummary> {
  return get<DashboardSummary>("/api/admin/dashboard");
}

// GET /api/admin/analytics
export async function getAnalytics(): Promise<Analytics> {
  return get<Analytics>("/api/admin/analytics");
}

// GET /api/admin/orders?status=&page= (최신 주문이 위로, 20개씩)
export async function getAdminOrders(status: OrderStatus | undefined, page: number): Promise<Page<Order>> {
  const query = status ? `status=${status}&page=${page}` : `page=${page}`;
  return get<Page<Order>>(`/api/admin/orders?${query}`);
}

// PATCH /api/admin/orders/{id}/status
// 포장 → 출고 → 배송중 → 배송완료, 회수중 → 회수완료 (배송 상태·재고·이력은 백엔드가 함께 바꾼다)
export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
  return patch<Order>(`/api/admin/orders/${orderId}/status`, { status });
}

// GET /api/admin/shipments?status=&page=
export async function getAdminShipments(
  status: ShipmentStatus | undefined,
  page: number
): Promise<Page<AdminShipment>> {
  const query = status ? `status=${status}&page=${page}` : `page=${page}`;
  return get<Page<AdminShipment>>(`/api/admin/shipments?${query}`);
}

// GET /api/admin/users?page=
export async function getAdminUsers(page: number): Promise<Page<AdminUser>> {
  return get<Page<AdminUser>>(`/api/admin/users?page=${page}`);
}

// GET /api/admin/products
export async function getAdminProducts(): Promise<ProductResponse[]> {
  return get<ProductResponse[]>("/api/admin/products");
}

// POST /api/admin/products
export async function createProduct(request: ProductRequest): Promise<ProductResponse> {
  return post<ProductResponse>("/api/admin/products", request);
}

// PUT /api/admin/products/{id}
export async function updateProduct(productId: number, request: ProductRequest): Promise<ProductResponse> {
  return put<ProductResponse>(`/api/admin/products/${productId}`, request);
}

// DELETE /api/admin/products/{id} (주문된 적 있는 상품이면 409 "주문 이력이 있는 상품은 삭제할 수 없습니다.")
export async function deleteProduct(productId: number): Promise<void> {
  await del<void>(`/api/admin/products/${productId}`);
}

// GET /api/admin/products + /api/admin/warehouses + /api/admin/inventories 를 합쳐서 재고 표를 만든다
export async function getInventoryTable(): Promise<InventoryTable> {
  const [productList, warehouseList, inventories] = await Promise.all([
    getAdminProducts(),
    get<Warehouse[]>("/api/admin/warehouses"),
    get<InventoryResponse[]>("/api/admin/inventories"),
  ]);

  const rows: InventoryRow[] = productList.map((product) => {
    const cells: InventoryCell[] = warehouseList.map((warehouse) => {
      const row = inventories.find((r) => r.productId === product.id && r.warehouseId === warehouse.id);
      // 이 물류센터에서 취급하지 않는 상품
      if (!row) {
        return { warehouseId: warehouse.id, quantity: null, reservedQuantity: 0, availableQuantity: 0, lowStock: false };
      }
      const available = getAvailableQuantity(row.quantity, row.reservedQuantity);
      return {
        warehouseId: warehouse.id,
        quantity: row.quantity,
        reservedQuantity: row.reservedQuantity,
        availableQuantity: available,
        lowStock: available < LOW_STOCK_THRESHOLD,
      };
    });

    return {
      productId: product.id,
      productName: product.name,
      categoryName: product.categoryName,
      cells,
      totalAvailable: cells.reduce((sum, cell) => sum + cell.availableQuantity, 0),
    };
  });

  return { warehouses: warehouseList, rows, lowStockThreshold: LOW_STOCK_THRESHOLD };
}
