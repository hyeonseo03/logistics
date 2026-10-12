// 아직 만들지 않은 페이지에 보여줄 임시 화면
// children 에 다른 페이지로 가는 링크 등을 넣을 수 있다
export default function PagePlaceholder({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-gray-500">준비 중</p>
      {children && <div className="mt-6 flex flex-col gap-2">{children}</div>}
    </div>
  );
}
