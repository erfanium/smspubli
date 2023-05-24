type Encoding = "UCS2" | "GSM7";

export interface SuccussResponseBody<Result> {
  status: "ok";
  result: Result;
}

export interface ErrorResponseBody {
  status: "error";
  error_id: string;
  error_msg: string;
}

interface ApiMessage {
  from: string;
  to: string;
  text: string;
  custom?: string;
  send_at?: string;
}

export interface ApiSendParams {
  messages: ApiMessage[];
  report_url?: string;
  concat?: 0 | 1;
  encoding?: Encoding;
  fake?: 0 | 1;
}
