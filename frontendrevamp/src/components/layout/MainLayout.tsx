import Header from "@/components/common/header";
import Footer from "@/components/common/footer";
import CookieBanner from "@/components/common/CookieBanner";

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
      <CookieBanner />
    </>
  );
}
