import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export interface NotionTask {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string;
  project?: string;
  url: string;
}

export interface CreateTaskParams {
  title: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  notes?: string;
  databaseId: string;
}

export async function getNotionTasks(databaseId: string): Promise<NotionTask[]> {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        or: [
          {
            property: "Status",
            status: {
              does_not_equal: "Done",
            },
          },
          {
            property: "ステータス",
            status: {
              does_not_equal: "完了",
            },
          },
        ],
      },
      sorts: [
        {
          property: "Due Date",
          direction: "ascending",
        },
      ],
      page_size: 20,
    });

    return response.results.map((page: any) => {
      const properties = page.properties;

      // タイトルプロパティを柔軟に取得
      const titleProp =
        properties.Name ||
        properties.Title ||
        properties.タスク ||
        properties.名前 ||
        Object.values(properties).find((p: any) => p.type === "title");

      const title =
        titleProp?.title?.[0]?.plain_text ||
        titleProp?.rich_text?.[0]?.plain_text ||
        "（タイトルなし）";

      // ステータスプロパティを柔軟に取得
      const statusProp =
        properties.Status ||
        properties.ステータス ||
        properties["状態"];

      const status =
        statusProp?.status?.name ||
        statusProp?.select?.name ||
        "未設定";

      // 優先度プロパティを柔軟に取得
      const priorityProp =
        properties.Priority ||
        properties.優先度 ||
        properties["重要度"];

      const priority =
        priorityProp?.select?.name || undefined;

      // 期限プロパティを柔軟に取得
      const dueDateProp =
        properties["Due Date"] ||
        properties.期限 ||
        properties.締め切り ||
        properties.Deadline;

      const dueDate =
        dueDateProp?.date?.start || undefined;

      // プロジェクトプロパティを柔軟に取得
      const projectProp =
        properties.Project ||
        properties.プロジェクト;

      const project =
        projectProp?.select?.name ||
        projectProp?.relation?.[0]?.id ||
        undefined;

      return {
        id: page.id,
        title,
        status,
        priority,
        dueDate,
        project,
        url: page.url,
      };
    });
  } catch (error) {
    console.error("Failed to fetch Notion tasks:", error);
    throw error;
  }
}

export async function createNotionTask(
  params: CreateTaskParams
): Promise<NotionTask> {
  try {
    // データベースのスキーマを取得して、プロパティ名を確認
    const db = await notion.databases.retrieve({
      database_id: params.databaseId,
    });

    const dbProperties = db.properties;

    // タイトルプロパティを特定
    const titlePropName =
      Object.entries(dbProperties).find(
        ([, prop]) => prop.type === "title"
      )?.[0] || "Name";

    const properties: any = {
      [titlePropName]: {
        title: [
          {
            text: {
              content: params.title,
            },
          },
        ],
      },
    };

    // ステータスプロパティが存在する場合
    const statusPropName = Object.keys(dbProperties).find(
      (k) => k === "Status" || k === "ステータス" || k === "状態"
    );
    if (statusPropName && dbProperties[statusPropName]) {
      const propType = dbProperties[statusPropName].type;
      if (propType === "status") {
        properties[statusPropName] = {
          status: { name: params.status || "Not started" },
        };
      } else if (propType === "select") {
        properties[statusPropName] = {
          select: { name: params.status || "未着手" },
        };
      }
    }

    // 優先度プロパティが存在する場合
    if (params.priority) {
      const priorityPropName = Object.keys(dbProperties).find(
        (k) => k === "Priority" || k === "優先度" || k === "重要度"
      );
      if (priorityPropName) {
        properties[priorityPropName] = {
          select: { name: params.priority },
        };
      }
    }

    // 期限プロパティが存在する場合
    if (params.dueDate) {
      const dueDatePropName = Object.keys(dbProperties).find(
        (k) =>
          k === "Due Date" ||
          k === "期限" ||
          k === "締め切り" ||
          k === "Deadline"
      );
      if (dueDatePropName) {
        properties[dueDatePropName] = {
          date: { start: params.dueDate },
        };
      }
    }

    const response = await notion.pages.create({
      parent: { database_id: params.databaseId },
      properties,
    }) as any;

    return {
      id: response.id,
      title: params.title,
      status: params.status || "Not started",
      priority: params.priority,
      dueDate: params.dueDate,
      url: response.url,
    };
  } catch (error) {
    console.error("Failed to create Notion task:", error);
    throw error;
  }
}

export async function searchNotionPages(query: string): Promise<any[]> {
  try {
    const response = await notion.search({
      query,
      filter: {
        value: "page",
        property: "object",
      },
      page_size: 5,
    });

    return response.results.map((page: any) => ({
      id: page.id,
      title:
        page.properties?.title?.title?.[0]?.plain_text ||
        page.properties?.Name?.title?.[0]?.plain_text ||
        "（タイトルなし）",
      url: page.url,
      lastEdited: page.last_edited_time,
    }));
  } catch (error) {
    console.error("Failed to search Notion pages:", error);
    throw error;
  }
}

export async function getNotionDatabases(): Promise<any[]> {
  try {
    const response = await notion.search({
      filter: {
        value: "database",
        property: "object",
      },
      page_size: 10,
    });

    return response.results.map((db: any) => ({
      id: db.id,
      title:
        db.title?.[0]?.plain_text || "（タイトルなし）",
      url: db.url,
    }));
  } catch (error) {
    console.error("Failed to fetch Notion databases:", error);
    throw error;
  }
}
