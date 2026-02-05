import { AutoIcon, LamGiauIcon, MultiConnectIcon } from "@/components/icons";
import { useCurrentOrg } from "@/hooks/orgs_data";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdOutlineCall, MdOutlineRemoveRedEye } from "react-icons/md";
import { RiRobot2Line } from "react-icons/ri";
export default function CampList() {
    const pathname = usePathname();
    const { currentOrg } = useCurrentOrg();

    const filteredOrgMenu = menuList.filter((menu) => {
        if (
            menu.path === "multiconnect" ||
            menu.path === "filldata" ||
            menu.path === "aichatbot" ||
            menu.path === "automation" ||
            menu.path === "hotline"
        ) {
            return currentOrg?.type === "ADMIN" || currentOrg?.type === "OWNER";
        }
        return true;
    });
    let tab = menuList.findIndex(
        (e) => e.path == (pathname.split("/")[4] ?? ""),
    );
    return (
        <div className="flex flex-col gap-3 p-4  overflow-y-auto">
            {filteredOrgMenu.map((e, i) => (
                <Link
                    key={i}
                    href={`/org/${pathname.split("/")[2]}/campaigns/${e.path}`}
                    className={cn(
                        ` bg-bg2 rounded-xl p-3 flex items-center gap-2 cursor-pointer hover:bg-bg2/60 transition-all`,
                        i == tab && "bg-[#E3DFFF] hover:bg-[#E3DFFF]/80",
                    )}
                >
                    <div className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center text-primary text-xl">
                        {e.icon}
                    </div>
                    <div
                        className={cn(
                            "text-title text-sm font-medium",
                            i == tab && "text-primary",
                        )}
                    >
                        {e.label}
                    </div>
                </Link>
            ))}
        </div>
    );
}

const menuList = [
    {
        icon: <MultiConnectIcon />,
        label: "Kết nối đa nguồn",
        path: "multiconnect",
    },
    {
        icon: <RiRobot2Line />,
        label: "AI Chatbot",
        path: "aichatbot",
    },

    {
        icon: <LamGiauIcon />,
        label: "Làm giàu dữ liệu",
        path: "filldata",
    },

    // {
    //     icon: <MdOutlineRemoveRedEye />,
    //     label: "AIDC",
    // },
    {
        icon: <AutoIcon />,
        label: "Automation ",
        path: "automation",
    },
    {
        icon: <MdOutlineCall />,
        label: "Tổng đài",
        path: "callcenter",
    },
    {
        icon: (
            <Image
                src="/icons/call_ico_2.svg"
                alt="call_campaign"
                width={22}
                height={22}
            />
        ),
        label: "Gọi hàng loạt",
        path: "call_campaign",
    },
];
