import { GraphQLFormattedError } from "graphql";

type Error = {
  message: string;
  status: string;
  statusCode: number;
};

const customFetch = async (url: string, options: RequestInit) => {
  const accessToken = localStorage.getItem("access_token");

  const headers = options.headers as Record<string, string>;

  return await fetch(url, {
    ...options,
    headers: {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
  });
};

const getGraphQLErrors = (
  body: Record<"errors", GraphQLFormattedError[] | undefined>
): Error | null => {
  if (!body) {
    return {
      message: "Unknown Error",
      status: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
    };
  }

  if ("errors" in body) {
    const errors = body?.errors;
    const messages = errors?.map((error) => error.message).join("");
    const code = errors?.[0].extensions?.code;

    return {
      message: messages || JSON.stringify(errors),
      status: "INTERNAL_SERVER_ERROR",
      statusCode: code || 500,
    };
  }

  return null;
};

export const fetchWrapper = async (url: string, options: RequestInit) => {
  const response = await customFetch(url, options);
  const responseClone = response.clone();
  const json = await responseClone.json();

  const error = getGraphQLErrors(json);

  if (error) throw error;

  return response;
};
