// telegram-bot/src/types/index.ts
export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  [key: string]: any;
}

export interface WebAppData {
  data: string;
  button_text: string;
}

export interface PurchaseData {
  action: "purchase_success" | "payment_failed" | "login_success";
  purchaseId?: string;
  promptId?: string;
  promptTitle?: string;
  amount?: number;
  reason?: string;
  userId?: string;
}

export interface BotContext {
  updateType: string;
  webAppData?: WebAppData;
  callbackQuery?: {
    data: string;
  };
  reply: (text: string, options?: any) => Promise<any>;
  replyWithMarkdown: (text: string, options?: any) => Promise<any>;
  answerCbQuery: () => Promise<any>;
  message?: {
    successful_payment?: {
      invoice_payload: string;
      total_amount: number;
    };
  };
  pre_checkout_query?: {
    id: string;
    from: TelegramUser;
    invoice_payload: string;
    total_amount: number;
  };
}
