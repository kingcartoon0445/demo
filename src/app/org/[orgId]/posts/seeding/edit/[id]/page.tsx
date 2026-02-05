import { PostsLayout } from "../../../components/PostsLayout";
import EditSeedingCampaign from "../components/EditSeedingCampaign";

export default function EditSeedingPage() {
    return (
        <PostsLayout activeKey="seeding">
            <EditSeedingCampaign />
        </PostsLayout>
    );
}
