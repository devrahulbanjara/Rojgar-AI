import Header from "@/components/common/header";
import Footer from "@/components/common/footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="page">{children}</main>
      <Footer />
    </>
  );
}
