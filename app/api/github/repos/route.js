import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route"; // path relative to this file

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Not logged in", { status: 401 });
  }

  const res = await fetch("https://api.github.com/user/repos", {
    headers: {
      Authorization: `token ${session.accessToken}`,
    },
  });

  const repos = await res.json();
  return Response.json(repos);
}
