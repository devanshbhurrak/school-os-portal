import { PageHeader } from "@/components/patterns/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportWizard } from "@/features/bulk-import/import-wizard";
import { ExportPanel } from "@/features/bulk-import/export-panel";
import { ImportHistory } from "@/features/bulk-import/import-history";

export default function DataManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Management"
        description="Bulk import and export records for your school."
      />
      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="import" className="mt-6">
          <ImportWizard />
        </TabsContent>
        <TabsContent value="export" className="mt-6">
          <ExportPanel />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <ImportHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
