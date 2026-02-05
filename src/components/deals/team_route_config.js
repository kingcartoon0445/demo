import { getMemberListFromTeamId, getRecall, updateRouting } from "@/api/team";
import { getSourceList } from "@/api/workspace";
import { MultiSelectPopover } from "@/components/multi_select_popover";
import { AssignRatioDialog } from "@/components/rule_config/assign_ratio_dialog";
import { RuleConfigPopover } from "@/components/rule_config/rule_config_popover";
import { TimeInputPopover } from "@/components/time_input_popover";
import { ToastPromise } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useCustomerParams } from "@/hooks/customers_data";
import { useTeamList } from "@/hooks/team_data";
import { useCurrentWorkspace } from "@/hooks/workspace_data";
import { customerSources, stageObject } from "@/lib/customerConstants";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { IoMdClose } from "react-icons/io";
import { MdCallMerge } from "react-icons/md";
import StageRecallPopover from "./stage_recall_popover";
const categoryRouteList = [
  { label: "Nhập vào", value: "ce7f42cf-f10f-49d2-b57e-0c75f8463c82" },
  { label: "Form", value: "3b70970b-e448-46fa-af8f-6605855a6b52" },
  { label: "AIDC", value: "38b353c3-ecc8-4c62-be27-229ef47e622d" },
];
const ruleTypes = {
  TEAM: "Đội sale của người phụ trách",
  ASSIGN_TO: "Chỉ định cụ thể",
  WORKSPACE: "Nhóm làm việc",
};
export default function TeamRouteConfig({ open, setOpen, setRefresh, item }) {
  const [categorySelected, setCategorySelected] = useState(
    JSON.parse(item?.automationCategory ?? "[]")
  );
  const [sourceSelected, setSourceSelected] = useState(
    JSON.parse(item?.automationSource ?? "[]")
  );
  const [sources, setSources] = useState(customerSources);
  const { currentWorkspace, setWorkspaceRefresh } = useCurrentWorkspace();
  useEffect(() => {
    setWorkspaceRefresh();
  }, []);

  const { orgId, workspaceId } = useCustomerParams();
  const [isAutomation, setIsAutomation] = useState(!item ? currentWorkspace.isAutomation : (item?.isAutomation ?? false));
  const [isRecall, setIsRecall] = useState(false);
  const [isAutoAssignRule, setIsAutoAssignRule] = useState(
    !item ? currentWorkspace.isAutoAssignRule : (item?.isAutoAssignRule ?? false)
  );
  const [categoryRoute, setCategoryRoute] = useState([]);
  const [sourceRoute, setSourceRoute] = useState([]);
  const [timeRule, setTimeRule] = useState({ hour: 0, minute: 10 });
  const [rule, setRule] = useState("TEAM");
  const [assignTeam, setAssignTeam] = useState();
  const [openAssignRatio, setOpenAssignRatio] = useState(false);
  const [assignList, setAssignList] = useState();
  const [isTeam, setIsTeam] = useState();
  const [isForce, setIsForce] = useState(false);
  const { teamList } = useTeamList();
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState(null);
  const [hasStageUpdate, setHasStageUpdate] = useState(false);

  const handleSubmit = () => {
    const config = {
      evictionRule: {
        status: isRecall ? 1 : 0,
        duration: timeRule.hour * 60 + timeRule.minute,
        rule: rule,
        isForce,
        condition: JSON.stringify({
          conjunction: "or",
          conditions: [
            {
              conjunction: "and",
              conditions: [
                {
                  ColumnName: "SourceId",
                  operator: "IN",
                  value: categoryRoute?.every((item) => item.checked === true)
                    ? "*"
                    : "",
                  extendValues: categoryRoute?.every(
                    (item) => item.checked === true
                  )
                    ? []
                    : categoryRoute
                      .filter((e) => e.checked)
                      .map((e) => e.value),
                },
                {
                  ColumnName: "UtmSource",
                  operator: "IN",
                  value: sourceRoute?.every((item) => item.checked === true)
                    ? "*"
                    : "",
                  extendValues: sourceRoute?.every(
                    (item) => item.checked === true
                  )
                    ? []
                    : sourceRoute.filter((e) => e.checked).map((e) => e.value),
                },
              ],
            },
          ],
        }),
        stage: hasStageUpdate ? stage?.id : null,
      },
      automationRule: {
        ratio: generateRatioList(assignList, isTeam),
        isAutoAssignRule,
        isAutomation,
        categoryList: categorySelected,
        sourceList: sourceSelected,
      },
    };
    if (!isLoading) {
      setIsLoading(true);
      if (rule == "ASSIGN_TO") config.evictionRule.assignTeamId = assignTeam.id;
      ToastPromise(() => updateRouting(
        orgId,
        workspaceId,
        item?.id ?? "",
        JSON.stringify(config)
      )
        .then((res) => {
          setIsLoading(false);
          if (res?.metadata?.exceptionEviction) return toast.error(res.metadata.exceptionEviction);
          toast.success("Cập nhật thành công cấu hình định tuyến");
          setOpen(false);
          setRefresh();
          setWorkspaceRefresh();
        }).catch(err => {
          setIsLoading(false);
          toast.error(err.message);
        }))
    }
  };
  useEffect(() => {
    setIsAutomation(!item ? currentWorkspace.isAutomation : (item?.isAutomation ?? false));
    setIsAutoAssignRule(!item ? currentWorkspace.isAutoAssignRule : (item?.isAutoAssignRule ?? false));
    if (item?.childs && item?.childs?.length != 0) {
      setIsTeam(true);
      setAssignList(item?.childs);
    } else if (item) {
      getMemberListFromTeamId(orgId, workspaceId, item?.id).then((res) => {
        if (res?.code != 0) return toast.error(res?.message);
        setIsTeam(false);
        setAssignList(res.content);
      });
    } else {
      setIsTeam(true);
      setAssignList(teamList);
    }
    getRecall(orgId, workspaceId, item?.id).then((res) => {
      if (res?.message) return;
      const content = res.content?.workspaceRule ?? res.content;
      const cond = JSON.parse(content.condition)["conditions"][0]["conditions"];
      const categoryData = cond[0];
      const sourceData = cond[1];
      const categoryRouteListTmp = JSON.parse(
        JSON.stringify(categoryRouteList)
      );
      if (categoryData["value"] == "*")
        categoryRouteListTmp?.forEach((e) => (e.checked = true));
      else
        categoryRouteListTmp?.forEach(
          (e) => (e.checked = categoryData.extendValues.includes(e.value))
        );
      const sourceRouteListTmp = JSON.parse(JSON.stringify(customerSources));
      if (sourceData["value"] == "*")
        sourceRouteListTmp?.forEach((e) => (e.checked = true));
      else
        sourceRouteListTmp?.forEach(
          (e) => (e.checked = sourceData.extendValues.includes(e.value))
        );
      setCategoryRoute(categoryRouteListTmp);
      setSourceRoute(sourceRouteListTmp);
      setTimeRule({
        hour: Math.floor(content.duration / 60),
        minute: content.duration % 60,
      });
      setRule(content.rule);
      if (content?.assignTeamId) {
        setAssignTeam({
          name: content?.assignTeamName,
          id: content?.assignTeamId,
        });
      }
      setIsRecall(content?.status == 1);
      setIsForce(content?.isForce);
      if (content?.stage) {
        const stageId = content.stage;
        const stageGroup = Object.values(stageObject).find(group =>
          group.data.some(stage => stage.id === stageId)
        );
        const stage = stageGroup?.data.find(stage => stage.id === stageId);
        setStage(stage);
        setHasStageUpdate(true);
      }
    });
  }, [currentWorkspace]);

  useEffect(() => {
    const fetchSources = async () => {
      const response = await getSourceList(orgId, workspaceId);
      if (response?.content) {
        const apiSources = response.content.map(source => ({
          value: source,
          label: source
        }));

        const combinedSources = [...customerSources];
        apiSources.forEach(source => {
          if (!combinedSources.some(s => s.value.toLowerCase() === source.value.toLowerCase())) {
            combinedSources.push(source);
          }
        });

        setSources(combinedSources);
      }
    };
    fetchSources();
  }, [orgId, workspaceId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="grid sm:max-w-xl h-auto pt-4 transition-all">
        {openAssignRatio && (
          <AssignRatioDialog
            isTeam={isTeam}
            assignList={assignList}
            setAssignList={setAssignList}
            open={openAssignRatio}
            setOpen={setOpenAssignRatio}
            isAutoAssignRule={isAutoAssignRule}
            setIsAutoAssignRule={setIsAutoAssignRule}
          />
        )}
        <DialogHeader>
          <DialogTitle
            className={
              "font-medium text-[20px] text-title flex items-center justify-between mb-3"
            }
          >
            <span>Định tuyến khách hàng của {item ? <span>đội sale <b>{item.name}</b></span> : "nhóm làm việc"}</span>
            
          </DialogTitle>
          <div className="w-[calc(100% + 1.5rem)] h-[1px] bg-[#E4E7EC] -mx-6" />
        </DialogHeader>
        <div className="flex flex-col items-center">
          {item && (
            <div className="flex flex-col w-full ">
              <div className="text-base font-medium">
                Điều kiện nhận khách hàng
              </div>
              <div className="text-sm font-medium mt-3">Theo phân loại</div>
              <MultiSelect
                options={[
                  {
                    value: "ce7f42cf-f10f-49d2-b57e-0c75f8463c82",
                    label: "Nhập vào",
                  },
                  {
                    value: "3b70970b-e448-46fa-af8f-6605855a6b52",
                    label: "Form",
                  },
                  {
                    value: "38b353c3-ecc8-4c62-be27-229ef47e622d",
                    label: "AIDC",
                  },
                ]}
                selected={categorySelected}
                onChange={setCategorySelected}
              />
              <div className="text-sm font-medium mt-3">Theo nguồn</div>
              <MultiSelect
                options={sources}
                selected={sourceSelected}
                onChange={setSourceSelected}
              />
            </div>
          )}
          <div className="flex flex-col w-full mt-4">
            <div className="text-base font-medium">Phân phối khách hàng</div>
            <RadioGroup
              value={isAutomation}
              onValueChange={setIsAutomation}
              className="mt-3 flex items-center gap-6"
            >
              <div className="flex items-center space-x-4">
                <RadioGroupItem value={true} />
                <Label htmlFor="r1" id="auto" className="flex flex-col">
                  Phân phối tự động{" "}
                  <div
                    onClick={() => {
                      setOpenAssignRatio(true);
                    }}
                    className="text-xs text-primary underline cursor-pointer"
                  >
                    Tùy chỉnh
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-4">
                <RadioGroupItem value={false} />
                <Label id="manual" htmlFor="r2">
                  Phân phối thủ công
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex flex-col w-full mt-4">
            <div className="text-base font-medium">
              Kịch bản thu hồi khách hàng
            </div>
            <div
              className={`w-full min-h-[150px] ${isRecall ? "bg-primary text-white" : "bg-bg1"
                } rounded-lg mt-2 flex flex-col py-3 px-4`}
            >
              <div className="flex items-center justify-between w-full">
                <MdCallMerge className="text-2xl -rotate-90" />
                {isForce && item ? (
                  <div
                    className={`bg-white px-3 py-1 text-primary text-xs rounded-xl`}
                  >
                    Áp dụng theo kịch bản quản trị viên
                  </div>
                ) : (
                  <Switch
                    checked={isRecall}
                    onCheckedChange={setIsRecall}
                    className="shadow-md"
                  />
                )}
              </div>
              <span
                className={`mt-3 ${isForce && item && "pointer-events-none"}`}
              >
                Nếu người phụ trách nhận khách hàng thuộc phân loại{" "}
                <MultiSelectPopover
                  dataList={categoryRoute}
                  setDataList={setCategoryRoute}
                >
                  <span
                    className={`cursor-pointer ${isRecall ? "text-white" : "text-primary"
                      } font-bold`}
                  >
                    {categoryRoute?.every((item) => item.checked === true)
                      ? "Tất cả"
                      : categoryRoute?.filter((item) => item.checked).length ==
                        0
                        ? "Chọn loại"
                        : categoryRoute
                          ?.filter((item) => item.checked)
                          ?.map((item) => item.label)
                          ?.join(", ")}
                  </span>
                </MultiSelectPopover>{" "}
                và nguồn{" "}
                <MultiSelectPopover
                  dataList={sourceRoute}
                  setDataList={setSourceRoute}
                >
                  <span
                    className={`cursor-pointer ${isRecall ? "text-white" : "text-primary"
                      } font-bold`}
                  >
                    {sourceRoute?.every((item) => item.checked === true)
                      ? "Tất cả"
                      : sourceRoute?.filter((item) => item.checked).length == 0
                        ? "Chọn nguồn"
                        : sourceRoute
                          .filter((item) => item.checked)
                          .map((item) => item.label)
                          .join(", ")}
                  </span>
                </MultiSelectPopover>
                , sau{" "}
                <TimeInputPopover time={timeRule} setTime={setTimeRule}>
                  <span
                    className={`cursor-pointer ${isRecall ? "text-white" : "text-primary"
                      } font-bold`}
                  >
                    {timeRule.hour} giờ {timeRule.minute} phút
                  </span>
                </TimeInputPopover>
                , <StageRecallPopover
                  stage={stage}
                  setStage={setStage}
                  hasStageUpdate={hasStageUpdate}
                  setHasStageUpdate={setHasStageUpdate}
                >
                  <span className={`cursor-pointer ${isRecall ? "text-white" : "text-primary"} font-bold`}>
                    {hasStageUpdate
                      ? ("chuyển trạng thái chăm sóc sang " + stage?.name)
                      : "không cập nhật tình trạng chăm sóc"}
                  </span>
                </StageRecallPopover> thì thu hồi về{" "}
                <RuleConfigPopover
                  rule={rule}
                  setRule={setRule}
                  assignTeam={assignTeam}
                  setAssignTeam={setAssignTeam}
                >
                  <span
                    className={`cursor-pointer ${isRecall ? "text-white" : "text-primary"
                      } font-bold`}
                  >
                    {assignTeam && rule == "ASSIGN_TO"
                      ? "Đội sale " + assignTeam.name
                      : ruleTypes[rule]}
                  </span>
                </RuleConfigPopover>
              </span>
              {!item && (
                <div className="flex items-center gap-2 mt-3 text-xs">
                  <Checkbox
                    checked={isForce}
                    onCheckedChange={setIsForce}
                    className={isRecall && "border border-white"}
                  />{" "}
                  Áp dụng cho tất cả đội Sale phía dưới
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="default"
            className="h-[35px]"
            onClick={handleSubmit}
          >
            Hoàn thành
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function generateRatioList(dataList, isTeam) {
  const countObject = [];

  dataList.forEach((x) => {
    countObject.push({
      refId: !isTeam ? x.profileId : x.id,
      ratio: x.ratio,
    });
  });

  return countObject;
}
