import Image from "next/image";

export const WalletBalance = ({ walletCredit = 0, onClick }) => (
    <span onClick={onClick} className="cursor-pointer text-title font-medium text-[18px] flex items-center gap-2">
        Số dư: {(walletCredit || 0).toLocaleString()}
        <Image
            src="/images/coka_coin.png"
            alt="coin"
            width={22}
            height={22}
            className="mb-[2px]"
        />
    </span>
);