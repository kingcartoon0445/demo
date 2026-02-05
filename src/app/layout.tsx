import "./globals.css";
import { Toaster } from "react-hot-toast";
import localFont from "next/font/local";
import { Suspense } from "react";
import Script from "next/script";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { defaultTitleHeader } from "@/lib/utils";
import LayoutWrapper from "@/components/LayoutWrapper";
import BasicAuth from "@/components/BasicAuth";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import LoadingWrapper from "@/components/LoadingWrapper";

// Thêm styles cho DevExtreme
import "devextreme/dist/css/dx.material.blue.light.css";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import { Loader2 } from "lucide-react";

const Sans = localFont({
    src: [
        {
            path: "../../public/fonts/GoogleSans-Regular.ttf",
            style: "normal",
            weight: "400",
        },
        {
            path: "../../public/fonts/GoogleSans-Medium.ttf",
            style: "medium",
            weight: "500",
        },
        {
            path: "../../public/fonts/GoogleSans-Bold.ttf",
            style: "bold",
            weight: "700",
        },
    ],
    variable: "--font-sans",
});
export const viewport = {
    maximumScale: 1,
    userScalable: false,
};
export const metadata = {
    metadataBase: new URL(`https://coka.ai`),
    title: defaultTitleHeader,
    description:
        "Coka là giải pháp về CRM từ tìm kiếm, chăm sóc và quản lý khách hàng chuyên biệt dành cho ngành bất động sản mở rộng cơ hội bán hàng cho sale thành công",
    keywords: "Coka, CRM bất động sản, ngành bất động sản, quản lý khách hàng",
    alternates: {
        canonical: "./",
    },
    version: "1.0.0",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                {/* Material Icons cho các màn mockup mới */}
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/icon?family=Material+Icons"
                />
            </head>
            <Script
                async
                defer
                crossOrigin="anonymous"
                src="https://connect.facebook.net/en_US/sdk.js"
            ></Script>
            <Script
                src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
                defer
            ></Script>

            <body className={`${Sans.variable} font-sans bg-[#FAFAFF]`}>
                <Toaster
                    position="top-center"
                    toastOptions={{
                        style: {
                            maxWidth: "400px",
                            wordBreak: "break-word",
                        },
                    }}
                />
                <ReactQueryProvider>
                    <LanguageProvider>
                        {/* <BasicAuth> */}
                        <LoadingWrapper>
                            <LayoutWrapper>
                                <Suspense
                                    fallback={
                                        <div className="flex items-center justify-center h-screen">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        </div>
                                    }
                                >
                                    <GoogleOAuthProvider clientId="882931293778-d7drekh9422bln8jhh98f812vl00d1tq.apps.googleusercontent.com">
                                        {children}
                                    </GoogleOAuthProvider>
                                </Suspense>
                            </LayoutWrapper>
                        </LoadingWrapper>
                        {/* </BasicAuth> */}
                    </LanguageProvider>
                </ReactQueryProvider>
            </body>
            <Script id="mobile-redirect">
                {`
    if (typeof window !== 'undefined') {
    const redirectToApp = () => {
      const isMobileScreen = window.innerWidth <= 767; // mobile breakpoint
      if (!isMobileScreen) return;

      const userAgent = navigator.userAgent.toLowerCase();
      const isAndroid = userAgent.includes('android');
      const isIOS = /iphone|ipad|ipod/.test(userAgent);

      if (isAndroid) {
        window.location.href = 'https://play.google.com/store/apps/details?id=vn.azvidi.coka&pcampaignid=web_share';
      } else if (isIOS) {
        window.location.href = 'https://apps.apple.com/vn/app/coka-ai-crm/id6756601348';
      }
    };

    // Kiểm tra ngay khi load
    redirectToApp();

    // Nếu người dùng resize xuống mobile, cũng check lại
    window.addEventListener('resize', redirectToApp);
  }
`}
            </Script>
        </html>
    );
}
