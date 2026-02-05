import { useWorkspaceList } from "@/hooks/workspace_data";
import { ScrollArea } from "@/components/ui/scroll-area";
import Avatar from "react-avatar";
import { getAvatarUrl, getFirstAndLastWord } from "@/lib/utils";
import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { getCustomersList } from "@/api/customer";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useDebounce } from "use-debounce";
import { useParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

// Component chọn workspace
const WorkspaceSelect = ({ workspaceList, onSelect, selectedWorkspace }) => (
    <div className="flex flex-col h-full">
        <ScrollArea className="flex-1">
            {workspaceList?.map((workspace, i) => (
                <div
                    key={i}
                    onClick={() => onSelect(workspace)}
                    className={`flex items-center gap-4 p-3 cursor-pointer hover:bg-accent ${selectedWorkspace?.id === workspace.id ? 'bg-accent' : ''}`}
                >
                    <Avatar
                        name={workspace.name}
                        src={getAvatarUrl(workspace.avatar)}
                        size="40"
                        round
                    />
                    <div className="font-medium">{workspace.name}</div>
                </div>
            ))}
        </ScrollArea>
    </div>
);

// Component danh sách khách hàng
const CustomerList = ({ customerList, loading, onAdd, addedPhones, onSelectAll, allSelected, hasMore, onLoadMore }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={allSelected}
                        onCheckedChange={onSelectAll}
                    />
                    <span>Thêm tất cả</span>
                </div>
            </div>
            <ScrollArea className="flex-1">
                {customerList.map((customer, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 border-b">
                        <Avatar
                            name={customer.fullName}
                            src={getAvatarUrl(customer.avatar)}
                            size="40"
                            round
                        />
                        <div className="flex-1">
                            <div className="font-medium">{customer.fullName}</div>
                            <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        </div>
                        <Button
                            size="sm"
                            variant={addedPhones.includes(customer.phone) ? "outline" : "default"}
                            onClick={() => onAdd(customer)}
                            className={addedPhones.includes(customer.phone) ? "text-muted-foreground" : ""}
                        >
                            {addedPhones.includes(customer.phone) ? "Đã thêm" : "Thêm"}
                        </Button>
                    </div>
                ))}
                {loading && <Loader2 className="my-4 h-8 w-8 animate-spin mx-auto" />}
                {hasMore && !loading && (
                    <div className="flex justify-center p-4">
                        <Button variant="outline" onClick={onLoadMore}>
                            Tải thêm
                        </Button>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};

const ImportContactForm = forwardRef(({ setIsCustomerList, handleBack, onAddContacts }, ref) => {
    const { workspaceList } = useWorkspaceList();
    const { orgId } = useParams();
    const [step, setStep] = useState(1);
    const [customerList, setCustomerList] = useState([]);
    const [addedPhones, setAddedPhones] = useState([]);
    const [allSelected, setAllSelected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [debouncedSearchText] = useDebounce(searchText, 500);
    const cancelRequestRef = useRef(null);
    const [selectedWorkspace, setSelectedWorkspace] = useState(null);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Thêm hàm để reset state
    const resetState = () => {
        setStep(1);
        setCustomerList([]);
        setAddedPhones([]);
        setAllSelected(false);
        setSelectedWorkspace(null);
        setPage(0);
        setHasMore(true);
        if (cancelRequestRef.current) {
            cancelRequestRef.current();
        }
    };

    // Export hàm handleBack để component cha có thể gọi
    useEffect(() => {
        handleBack.current = resetState;
    }, []);

    useEffect(() => {
        if (cancelRequestRef.current) {
            cancelRequestRef.current();
        }
    }, [debouncedSearchText]);

    const fetchCustomers = async (selectedWorkspace) => {
        setLoading(true);

        const abortController = new AbortController();
        cancelRequestRef.current = () => abortController.abort();

        try {
            const value = await getCustomersList(
                orgId,
                selectedWorkspace.id,
                page,
                searchText,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                abortController.signal,
                20
            );

            if (value?.code === 0) {
                setCustomerList(prev => page === 0 ? value.content : [...prev, ...value.content]);
                if ((value?.content?.length ?? 0) < 20) {
                    setHasMore(false);
                } else {
                    setPage(prev => prev + 1);
                }
            } else if (value?.message) {
                toast.error(value?.message);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                toast.error('Có lỗi xảy ra khi tải danh sách khách hàng');
                console.error('Error fetching customers:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectWorkspace = (workspace) => {
        setSelectedWorkspace(workspace);
        setCustomerList([]);
        setStep(2);
        setPage(0);
        setHasMore(true);
        fetchCustomers(workspace);
        setIsCustomerList(true);
    };

    const handleSelectAll = (checked) => {
        setAllSelected(checked);
        if (checked) {
            const formattedContacts = customerList.map(customer => ({
                name: customer.fullName,
                phone: customer.phone,
                note: ''
            }));
            setSelectedContacts(formattedContacts);
            setAddedPhones(customerList.map(c => c.phone));
        } else {
            setSelectedContacts([]);
            setAddedPhones([]);
        }
    };

    const handleAddSingle = (customer) => {
        if (!addedPhones.includes(customer.phone)) {
            const newContact = {
                name: customer.fullName,
                phone: customer.phone,
                note: ''
            };
            setSelectedContacts(prev => [...prev, newContact]);
            setAddedPhones(prev => [...prev, customer.phone]);
        }
    };

    useImperativeHandle(ref, () => ({
        submitSelected: () => {
            if (selectedContacts.length > 0) {
                onAddContacts(selectedContacts);
                return true;
            }
            return false;
        }
    }));

    return (
        <div className="flex flex-col h-[500px]">
            <div className="flex-1">
                {step === 1 && (
                    <WorkspaceSelect
                        workspaceList={workspaceList}
                        onSelect={handleSelectWorkspace}
                        selectedWorkspace={selectedWorkspace}
                    />
                )}
                {step === 2 && (
                    <CustomerList
                        customerList={customerList}
                        loading={loading}
                        onAdd={handleAddSingle}
                        addedPhones={addedPhones}
                        onSelectAll={handleSelectAll}
                        allSelected={allSelected}
                        hasMore={hasMore}
                        onLoadMore={() => fetchCustomers(selectedWorkspace)}
                    />
                )}
            </div>
        </div>
    );
});

ImportContactForm.displayName = 'ImportContactForm';

export default ImportContactForm; 