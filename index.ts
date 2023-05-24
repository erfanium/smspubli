import {
  ApiSendParams,
  ErrorResponseBody,
  SuccussResponseBody,
} from "api_types";
import { DateTime } from "luxon";

export type Encoding = "UCS2" | "GSM7";

export interface SmspubliCtorParams {
  apiKey: string;
  from: string;
  endpoint?: string;
  fake?: boolean;
  fetch?: typeof fetch;
}

export interface Message {
  to: string;
  text: string;
  from?: string;
  custom?: string;
  send_at?: Date | string;
}

export interface SendParams {
  messages: Message[];
  report_url?: string;
  concat?: boolean;
  encoding?: Encoding;
}

export type SendResult =
  | {
      status: "ok";
      sms_id: string;
      custom: string;
    }
  | {
      status: "error";
      error_id: string;
      error_msg: string;
      custom?: string;
    };

export class SmspubliError extends Error {
  code: string;
  description: string;
  url: string;
  params: unknown;
  constructor(code: string, description: string, url: string, params: unknown) {
    super(`${code}: ${description}`);
    this.code = code;
    this.description = description;
    this.url = url;
    this.params = params;
  }
}

const sendAtFormatter = (value: string | Date) => {
  if (typeof value === "string") return value;
  return DateTime.fromJSDate(value)
    .setZone("Europe/Madrid")
    .toFormat("yyyy-MM-dd HH:mm:ss");
};

export class Smspubli {
  endpoint = "https://api.gateway360.com/api/3.0/sms";
  apiKey: string;
  fake = false;
  from: string;

  #headers = new Headers();
  #fetch = fetch;

  constructor(params: SmspubliCtorParams) {
    this.apiKey = params.apiKey;
    this.from = params.from;

    if (params.endpoint) this.endpoint = params.endpoint;
    if (params.fake) this.fake = params.fake;
    if (params.fetch) this.#fetch = params.fetch;

    this.#headers.set("Content-Type", "application/json");
  }

  async send({
    messages,
    concat,
    encoding,
  }: SendParams): Promise<SendResult[]> {
    const params: ApiSendParams = {
      messages: messages.map(({ from, to, text, custom, send_at }) => ({
        from: from ?? this.from,
        to,
        text,
        custom,
        send_at: send_at ? sendAtFormatter(send_at) : undefined,
      })),
      concat: concat ? 1 : 0,
      fake: this.fake ? 1 : 0,
      encoding,
    };

    const result = this.#callApi("/send", params) as Promise<SendResult[]>;
    return result;
  }

  async #callApi(path: string, params: Record<any, any>) {
    const url = this.endpoint + path;

    const requestBody = {
      api_key: this.apiKey,
      ...params,
    };

    const response = await this.#fetch(url, {
      method: "POST",
      headers: this.#headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const body = (await response.json()) as ErrorResponseBody;
      throw new SmspubliError(body.error_id, body.error_msg, url, params);
    }

    const responseBody =
      (await response.json()) as SuccussResponseBody<unknown>;

    return responseBody.result;
  }
}
