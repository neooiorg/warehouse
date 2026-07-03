import PageContainer from '@/components/layout/page-container';
import { KanbanBoard } from './kanban-board';
import NewTaskDialog from './new-task-dialog';

export default function KanbanViewPage() {
  return (
    <PageContainer
      pageTitle='Bảng công việc'
      pageDescription='Kéo thả để theo dõi tiến độ.'
      pageHeaderAction={<NewTaskDialog />}
    >
      <KanbanBoard />
    </PageContainer>
  );
}
