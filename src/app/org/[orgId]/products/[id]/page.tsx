"use client";

import Loading from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import {
    useGetProductById,
    useUpdateProduct,
    useUpdateProductAssignee,
    useGetCategory,
} from "@/hooks/useProduct";
import { CreateUpdateProduct } from "@/lib/interface";
import { ArrowLeftIcon, EditIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import DetailsSection from "./components/DetailsSection";
import ImageSection from "./components/ImageSection";
import ProductTabs from "./components/ProductTabs";
import OwnerSelector from "@/components/componentsWithHook/OwnerSelector";
import FollowerSelector from "@/components/componentsWithHook/FollowerSelector";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.orgId as string;
    const productId = params.id as string;
    const queryClient = useQueryClient();
    const {
        data: productData,
        isLoading,
        refetch,
    } = useGetProductById(orgId, productId);
    const { data: categoryData, isLoading: isCategoryLoading } =
        useGetCategory(orgId);
    const categories = categoryData?.data || [];
    const product = productData?.data;
    const { t } = useLanguage();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isImageExpanded, setIsImageExpanded] = useState(true);
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState("prices");
    const [isOwnerPopoverOpen, setIsOwnerPopoverOpen] = useState(false);
    const [isFollowerPopoverOpen, setIsFollowerPopoverOpen] = useState(false);
    const owner = product?.assignedTo?.find(
        (assignee) => assignee.type === "OWNER"
    );
    const followers = product?.assignedTo?.filter(
        (assignee) => assignee.type === "FOLLOWER"
    );
    const handleBack = () => {
        router.back();
    };

    const handleImageSelect = useCallback((index: number) => {
        setCurrentImageIndex(index);
    }, []);
    const { mutate: updateProduct } = useUpdateProduct(orgId, productId);
    const { mutateAsync: updateProductAssignee } = useUpdateProductAssignee(
        orgId,
        productId
    );
    const handleDetailsSave = useCallback((data: CreateUpdateProduct) => {
        updateProduct(data);
    }, []);

    const handleOwnerChange = async (member: any) => {
        if (!member || !productId) return;

        // // Logic: Chỉ có 1 owner duy nhất
        // // Nếu có owner cũ, chuyển owner cũ thành follower
        // const currentOwnerIds = owner ? [owner.profileId] : [];
        // const newFollowerIds = followers.map((f) => f.profileId);

        // // Nếu có owner cũ và owner mới khác owner cũ
        // if (owner && member.profileId !== owner.profileId) {
        //     // Thêm owner cũ vào danh sách followers
        //     newFollowerIds.push(owner.profileId);
        // }

        // // Loại bỏ member mới khỏi followers (nếu có)
        // const updatedFollowerIds = newFollowerIds.filter(
        //     (id) => id !== member.profileId
        // );

        // Cập nhật owner mới
        updateProductAssignee({
            body: {
                assigneeIds: [member.profileId || member.teamId],
                assigneeType: "OWNER",
            },
        });

        // // Nếu có followers, cập nhật luôn danh sách followers
        // if (updatedFollowerIds.length > 0) {
        //     setTimeout(() => {
        //         assignCustomerMutation.mutate({
        //             type: "member",
        //             role: "FOLLOWER",
        //             ids: updatedFollowerIds,
        //         });
        //     }, 500);
        // }

        setIsOwnerPopoverOpen(false);
    };

    const handleFollowersChange = (followers: any[]) => {
        if (!productId) return;

        // Tách followers thành members và teams dựa trên type
        const members = followers.filter((f) => f.type === "member");
        const teams = followers.filter((f) => f.type === "team");

        // Lấy IDs của members (profileId hoặc id)
        const memberIds = members.map(
            (member) => member.profileId || member.id
        );

        // Lấy IDs của teams
        const teamIds = teams.map((team) => team.id);

        // Cập nhật followers cho members
        if (memberIds.length > 0) {
            updateProductAssignee({
                body: {
                    assigneeIds: memberIds,
                    assigneeType: "FOLLOWER",
                },
            });
        }

        // Cập nhật followers cho teams
        if (teamIds.length > 0) {
            updateProductAssignee({
                body: {
                    assigneeIds: teamIds,
                    assigneeType: "FOLLOWER",
                },
            });
        }
    };

    if (isLoading) {
        return <Loading />;
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl font-semibold mb-2">
                    Không tìm thấy sản phẩm
                </h2>
                <Button onClick={handleBack}>Quay lại</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white">
            <div className="bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 w-1/4 p-4">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">{product.name}</h1>
                </div>
                <div className="flex items-center gap-4 w-3/4 justify-end p-4">
                    <OwnerSelector
                        orgId={orgId}
                        owner={owner}
                        handleOwnerChange={handleOwnerChange}
                        isOpen={isOwnerPopoverOpen}
                        setIsOpen={setIsOwnerPopoverOpen}
                    />
                    <FollowerSelector
                        orgId={orgId}
                        followers={followers || []}
                        handleFollowersChange={handleFollowersChange}
                        isOpen={isFollowerPopoverOpen}
                        setIsOpen={setIsFollowerPopoverOpen}
                        ownerId={owner?.id}
                    />
                </div>
            </div>
            {/* Left Sidebar */}
            <div className="flex">
                <div className="w-1/4 flex flex-col space-y-2 border-r border-gray-200 p-4">
                    <div className="border rounded-md bg-white">
                        {/* Image Section */}
                        <ImageSection
                            product={product}
                            currentImageIndex={currentImageIndex}
                            isExpanded={isImageExpanded}
                            setIsExpanded={setIsImageExpanded}
                            onImageSelect={handleImageSelect}
                            orgId={orgId}
                            refetch={refetch}
                        />
                    </div>
                    <div className="border rounded-md bg-white">
                        {/* Details Section */}
                        <DetailsSection
                            product={product}
                            isExpanded={isDetailsExpanded}
                            setIsExpanded={setIsDetailsExpanded}
                            onSave={handleDetailsSave}
                            categories={categories}
                            isCategoryLoading={isCategoryLoading}
                        />
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col">
                    {/* Tabs Content */}
                    <div className="flex-1 overflow-hidden">
                        <ProductTabs
                            product={product}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            onSave={handleDetailsSave}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
