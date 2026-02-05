import PriceHistoryModal from "@/components/products/PriceHistoryModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateUpdateProduct, Product } from "@/lib/interface";
import { formatCurrency } from "@/lib/utils";
import { History, Pencil, Plus, Save, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Transaction from "@/components/products/transaction/Transaction";

interface ProductTabsProps {
    product: Product;
    activeTab: string;
    setActiveTab: (value: string) => void;
    onSave: (data: CreateUpdateProduct) => void;
}

export default function ProductTabs({
    product,
    activeTab,
    setActiveTab,
    onSave,
}: ProductTabsProps) {
    const { t } = useLanguage();
    const [isEditPrice, setIsEditPrice] = useState(false);
    const [price, setPrice] = useState(product.price || 0);
    useEffect(() => {
        setPrice(product.price || 0);
    }, [product.price]);
    const [isOpenPriceHistory, setIsOpenPriceHistory] = useState(false);
    const handleSavePrice = () => {
        onSave({
            name: product.name,
            code: product.code || "",
            price: price,
            tax: product.tax || 0,
            categoryIds:
                product.categories?.map((category) => category.id) || [],
            description: product.description || "",
            status: product.status,
        });

        setIsEditPrice(false);
    };
    return (
        <>
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full bg-white"
            >
                <TabsList className="w-fit border border-gray-100 p-1 bg-gray-50 rounded-lg flex items-center gap-1 mx-4 mt-0">
                    <TabsTrigger
                        value="prices"
                        className="flex-1 min-w-[120px] rounded-md px-4 py-2 text-sm font-bold text-gray-500 transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm hover:text-gray-900"
                    >
                        {t("common.price")}
                    </TabsTrigger>
                    <TabsTrigger
                        value="deals"
                        className="flex-1 min-w-[120px] rounded-md px-4 py-2 text-sm font-bold text-gray-500 transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm hover:text-gray-900"
                    >
                        {t("product.deals")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="prices" className="mt-0 px-2">
                    {(() => {
                        type Row = {
                            id: string;
                            currency: string;
                            unitPrice: number;
                        };
                        const columns: ColumnDef<Row>[] = [
                            {
                                accessorKey: "currency",
                                header: t("common.currency") as string,
                                cell: ({ row }) => (
                                    <span>{row.original.currency}</span>
                                ),
                            },
                            {
                                accessorKey: "unitPrice",
                                header: t("common.unitPrice") as string,
                                cell: () =>
                                    isEditPrice ? (
                                        <Input
                                            value={price}
                                            onChange={(e) =>
                                                setPrice(Number(e.target.value))
                                            }
                                            className="h-8"
                                        />
                                    ) : (
                                        <span>{formatCurrency(price)}</span>
                                    ),
                            },
                            {
                                id: "actions",
                                header: "",
                                cell: () =>
                                    !isEditPrice ? (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex items-center gap-1"
                                                onClick={() =>
                                                    setIsEditPrice(true)
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex items-center gap-1"
                                                onClick={() =>
                                                    setIsOpenPriceHistory(true)
                                                }
                                            >
                                                <History className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex items-center gap-1"
                                            onClick={handleSavePrice}
                                        >
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    ),
                            },
                        ];
                        const data: Row[] = [
                            { id: "price", currency: "VND", unitPrice: price },
                        ];
                        return (
                            <div className="bg-white py-2">
                                <DataTable<Row, unknown>
                                    columns={columns}
                                    data={data}
                                />
                            </div>
                        );
                    })()}
                </TabsContent>

                <TabsContent value="variations">
                    <div className="bg-white rounded-lg p-2">
                        <div className="flex flex-col items-center justify-center h-40">
                            <p className="text-gray-500">
                                Không có biến thể nào
                            </p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="files">
                    <div className="bg-white rounded-lg p-2">
                        <div className="flex flex-col items-center justify-center h-40">
                            <p className="text-gray-500">
                                Không có tệp đính kèm nào
                            </p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="deals">
                    <div className="pt-2 px-2">
                        <Transaction productId={product.id} />
                    </div>
                </TabsContent>
            </Tabs>
            <PriceHistoryModal
                isOpen={isOpenPriceHistory}
                onClose={() => setIsOpenPriceHistory(false)}
                productId={product.id}
            />
        </>
    );
}
