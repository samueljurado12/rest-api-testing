import { expect, test } from "@playwright/test";
import HttpStatusCode from "../utils";
import { PostsRequest } from "../pages";

test.describe("2. Retrieve list of posts", () => {
  test("Should return complete list of posts", async ({ request }) => {
    const usersRequest = new PostsRequest(request);
    const response = await usersRequest.getPosts();

    expect(response.status()).toBe(HttpStatusCode.OK);
    const responseBody = await response.json();
    expect(Array.isArray(responseBody)).toBeTruthy();
    expect(responseBody.length).toBeGreaterThanOrEqual(0);
  });
});
