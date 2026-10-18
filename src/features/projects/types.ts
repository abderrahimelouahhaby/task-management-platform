export type ProjectDto = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  archived: boolean;
  taskCount: number;
  createdAt: string;
};
