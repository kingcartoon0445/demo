import { CokaLogo, CokaText } from "./icons";

export default function LoadingPage({ isAnimate }: { isAnimate: boolean }) {
    return (
        <main
            className={`flex flex-col w-full h-screen gap-6 items-center justify-center loading-bg ${
                isAnimate ? "animate-coka-text" : ""
            }`}
        >
            <CokaLogo />
            <CokaText />
        </main>
    );
}
