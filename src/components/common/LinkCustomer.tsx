import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LinkCustomer({
    setIsFindCustomerModalOpen,
    handleOpenAddCustomerModal,
}: {
    setIsFindCustomerModalOpen: (open: boolean) => void;
    handleOpenAddCustomerModal: () => void;
}) {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-[14px] text-black font-medium">
                    Khách hàng
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                    {t("common.selectCustomer")}
                </p>

                <div className="flex flex-col gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsFindCustomerModalOpen(true)}
                    >
                        {t("common.chooseExistingCustomer")}
                    </Button>
                    <Button
                        className="flex-1 bg-primary text-white"
                        onClick={handleOpenAddCustomerModal}
                    >
                        {t("common.createNewCustomer")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
