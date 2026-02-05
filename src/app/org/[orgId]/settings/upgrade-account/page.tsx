"use client";
import { Glass } from "@/components/Glass";
import SubsCard from "@/components/subs_card";
import { type CarouselApi } from "@/components/ui/carousel";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscriptionPackages } from "@/hooks/usePayment";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function UpgradeAccountPage() {
    const { t } = useLanguage();
    const { orgId } = useParams();
    const { data: subscriptionPackages, isLoading } = useSubscriptionPackages(
        orgId as string,
    );
    const subscriptionPackagesData = subscriptionPackages?.content;
    const [currentSubscriptionId, setCurrentSubscriptionId] =
        useState<string>("");
    const [currentSubscription, setCurrentSubscription] = useState<any>(null);
    useEffect(() => {
        if (subscriptionPackagesData) {
            // const enterpriseIntro = subscriptionPackagesData.data.find(
            //     (item: any) => item.packageType === "SUBSCRIPTION"
            // );
            // setEnterpriseIntro(enterpriseIntro);
        }
    }, [subscriptionPackagesData]);

    const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    useEffect(() => {
        if (!carouselApi) return;
        setCurrentIndex(carouselApi.selectedScrollSnap());
        const onSelect = () =>
            setCurrentIndex(carouselApi.selectedScrollSnap());
        carouselApi.on("select", onSelect);
        return () => {
            // @ts-ignore embla may not have off typed
            carouselApi.off && carouselApi.off("select", onSelect);
        };
    }, [carouselApi]);

    return (
        <div className="h-full">
            <Glass intensity="high" className="h-full w-full rounded-2xl">
                <div className="p-4 h-full">
                    <SubsCard
                        setCurrentSubscriptionId={setCurrentSubscriptionId}
                    />
                </div>
            </Glass>
        </div>
    );
}
