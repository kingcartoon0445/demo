"use client";
import { MdContentCopy, MdKeyboardBackspace } from "react-icons/md";
import {
    useParams,
    useRouter,
    useSearchParams,
    usePathname,
} from "next/navigation";
import { useEffect, useState } from "react";
import { getCreditPackages, orderAndPayCredit } from "@/api/payment";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { RiBankLine } from "react-icons/ri";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { LuDownload } from "react-icons/lu";
import PaymentDialog from "../components/payment_dialog";
import BankTransferDialog from "../components/bank_transfer_dialog";
const depositSteps = ["Chọn gói", "Thanh toán"];
const Step1 = ({
    coupon,
    setCoupon,
    handleContinue,
    creditPackages,
    selectedCreditPackage,
    setSelectedCreditPackage,
    paymentMethod,
    setPaymentMethod,
    paymentMethods,
    coinAmount,
    setCoinAmount,
}) => {
    const formatNumber = (num) => {
        if (num === null || num === undefined || num === "") return "";
        try {
            const n = Number(num);
            if (Number.isNaN(n)) return "";
            return n.toLocaleString("vi-VN");
        } catch {
            return String(num);
        }
    };

    const handleCoinInputChange = (e) => {
        const value = e.target.value.replace(/\D/g, "");
        const numeric = value === "" ? 0 : Number(value);
        setCoinAmount(numeric);
        // Tìm gói credit phù hợp với số coin nhập vào
        const matchingPackage = creditPackages.find(
            (pkg) => pkg.credit === numeric
        );
        setSelectedCreditPackage(matchingPackage || null);
    };

    useEffect(() => {
        if (selectedCreditPackage) {
            setCoinAmount(selectedCreditPackage.credit);
        }
    }, [selectedCreditPackage]);

    return (
        <div className="flex flex-col items-center h-full flex-1 overflow-y-auto border-r">
            <div className="px-4 w-full mt-6">
                <div className="rounded-lg bg-[#F3F0FF] w-full flex items-center justify-center gap-2 text-text2">
                    <Input
                        className="bg-transparent text-center outline-none w-full border-none"
                        type="text"
                        inputMode="numeric"
                        placeholder="Nhập số Coin (Bội số của 50.000)"
                        value={formatNumber(coinAmount)}
                        onChange={handleCoinInputChange}
                    />
                </div>
            </div>
            <div className="flex items-center w-full gap-2 mt-4 mb-2">
                <div className="h-[1px] w-full bg-gray-300" />
                <div className="text-text2 text-xs whitespace-nowrap">
                    Chọn gói
                </div>
                <div className="h-[1px] w-full bg-gray-300" />
            </div>
            <div className="box px-4 py-3 rounded-lg gap-3 w-full">
                {creditPackages.map((creditPackage, index) => (
                    <div
                        key={index}
                        className={cn(
                            "flex flex-col p-2 rounded-lg bg-[#F3F0FF] cursor-pointer",
                            selectedCreditPackage?.id === creditPackage.id &&
                                "bg-primary text-white"
                        )}
                        onClick={() => setSelectedCreditPackage(creditPackage)}
                    >
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1 text-sm font-medium">
                                {creditPackage?.credit.toLocaleString()}
                                <Image
                                    src="/images/coka_coin.png"
                                    alt="coin"
                                    width={16}
                                    height={16}
                                />
                            </div>
                            <div
                                className={cn(
                                    "text-text2 text-xs font-medium",
                                    selectedCreditPackage?.id ===
                                        creditPackage.id && "text-white"
                                )}
                            >
                                {creditPackage?.price.toLocaleString()} đ
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col rounded-lg w-full mt-5 mb-3 px-4">
                <div className="text-title text-sm font-medium">
                    Mã khuyến mãi
                </div>

                <div className="pt-2 flex items-center gap-3">
                    <Input
                        className="w-full rounded-lg"
                        placeholder="Nhập mã khuyến mãi"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                    />
                    <Button>Áp dụng</Button>
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full px-4 mt-4 pb-8">
                <span className="text-sm text-title font-medium">
                    Phương thức thanh toán
                </span>
                <RadioGroup value={paymentMethod}>
                    {paymentMethods.map((method) => (
                        <div
                            className="flex items-center gap-2 border border-[#E4E7EC] rounded-md py-2 px-4 cursor-pointer"
                            onClick={() => setPaymentMethod(method.id)}
                            key={method.id}
                        >
                            <RadioGroupItem value={method.id} />
                            <span className="text-sm text-title font-medium">
                                {method.name}
                            </span>
                            <Image
                                src={paymentIcons[method.name]}
                                alt={method.name}
                                width={26}
                                height={26}
                                className="ml-auto h-[34px] w-[34px] rounded-full border p-1"
                            />
                        </div>
                    ))}
                </RadioGroup>
            </div>
        </div>
    );
};

export default function DepositPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [selectedCreditPackage, setSelectedCreditPackage] = useState(null);
    const [creditPackages, setCreditPackages] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState(
        "5f4f7e9b-85f4-11ef-bbd8-02981be25414"
    );
    const [coinAmount, setCoinAmount] = useState(
        selectedCreditPackage?.credit || ""
    );
    const [paymentMethods, setPaymentMethods] = useState([
        // { id: "5ddc74a5-74d2-11ef-9351-02981be25414", name: "VNPay" },
        {
            id: "5f4f7e9b-85f4-11ef-bbd8-02981be25414",
            name: "Chuyển khoản ngân hàng",
        },
    ]);
    const [coupon, setCoupon] = useState("");
    const [loading, setLoading] = useState(false);
    const { orgId } = useParams();

    useEffect(() => {
        const fetchCreditPackages = async () => {
            const response = await getCreditPackages(orgId);
            if (response.code === 0) {
                setCreditPackages(response.content);
            }
        };
        fetchCreditPackages();
    }, []);

    const handleContinue = async () => {
        if (Number(coinAmount) <= 0)
            return toast.error("Số coin phải lớn hơn 0");
        if (!coinAmount) return toast.error("Vui lòng chọn gói");
        if (!paymentMethod)
            return toast.error("Vui lòng chọn phương thức thanh toán");
        if (Number(coinAmount) % 50000 !== 0)
            return toast.error("Số coin phải là bội số của 50.000");
        if (loading) return;

        setLoading(true);
        try {
            const response = await orderAndPayCredit(orgId, {
                packageId: creditPackages[0].id,
                voucherId: "string",
                paymentMethodId: paymentMethod,
                custom: {
                    value: Number(coinAmount),
                },
            });

            if (response?.message) {
                toast.error(response.message);
                return;
            }

            if (paymentMethod === "5ddc74a5-74d2-11ef-9351-02981be25414") {
                const isDev = window.location.hostname === "localhost";
                const url = isDev
                    ? `${response?.content?.orderUrl}?mode=dev`
                    : response?.content?.orderUrl;
                router.push(url);
            }
            if (paymentMethod === "5f4f7e9b-85f4-11ef-bbd8-02981be25414") {
                router.push(
                    pathname + "?bankApi=" + response?.content?.orderUrl
                );
            }
        } catch (error) {
            toast.error(error?.message ?? "Có lỗi xảy ra");
        }
        setLoading(false);
    };

    return (
        <div className="flex-1 rounded-2xl flex flex-col bg-white items-center">
            <div className="flex items-center w-full pl-5 pr-3 py-4 border-b relative">
                <MdKeyboardBackspace
                    className="text-xl cursor-pointer"
                    onClick={() => router.back()}
                />
                <div className="text-[18px] font-medium ml-2">Nạp coin</div>
            </div>
            <div className="flex items-center h-full w-full overflow-y-auto">
                <Step1
                    coupon={coupon}
                    setCoupon={setCoupon}
                    creditPackages={creditPackages}
                    selectedCreditPackage={selectedCreditPackage}
                    setSelectedCreditPackage={setSelectedCreditPackage}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    paymentMethods={paymentMethods}
                    coinAmount={coinAmount}
                    setCoinAmount={setCoinAmount}
                />
                <div className="flex flex-col flex-1 h-full">
                    <div className="flex flex-col gap-2 mt-6 px-4">
                        <Label
                            title="Giá trị đơn hàng"
                            value={`${Number(coinAmount).toLocaleString(
                                "vi-VN"
                            )}đ`}
                        />
                        <Label title="Ưu đãi" value={"0đ"} />
                        <Label
                            title="Số tiền cần thanh toán"
                            value={`${Number(coinAmount).toLocaleString(
                                "vi-VN"
                            )}đ`}
                        />
                    </div>
                    <Button
                        className="w-[70%] mx-auto mt-6 rounded-xl"
                        onClick={handleContinue}
                    >
                        Thanh toán
                    </Button>
                    <div className="text-xs mt-4 px-4">Lưu ý:</div>
                    <ul className="text-xs px-4 text-title list-disc list-inside pl-6 mt-1">
                        {noteList.map((note, index) => (
                            <li key={index}>{note}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
const noteList = [
    "1đ = 1 Coka coin",
    "Coka coin được dùng thể thanh toán các tiện ích bên trong ứng dụng COKA",
    "Coka Coin có thể được sở hữu thông qua các hình thức : nhập mã quà tặng, nạp Coka Coin trực tiếp vào tài khoản, chuyển, tặng cho tổ chức khác trên ứng dụng COKA",
    "Coka Coin sẽ được thêm vào tài khoản của bạn sau khi giao dịch thành công",
    "Các gói Top-up Coka Coin không thể huỷ/ trả.",
];
const Label = ({ title, value }) => {
    return (
        <div className="flex items-center justify-between w-full">
            <div className="text-title text-sm font-medium">{title}</div>
            <div className="text-sm">{value}</div>
        </div>
    );
};

const paymentIcons = {
    // "VNPay": "/icons/vnpay.svg",
    "Chuyển khoản ngân hàng": "/icons/bank-transfer.svg",
};
