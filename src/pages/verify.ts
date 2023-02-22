import type { APIRoute } from "astro";
import { MongoClient } from "mongodb";

// Connection URL
const url = import.meta.env.MONGODB_URI;
const client = new MongoClient(url);
const dbName = "verification";
const dbCollection = "names";

export const post: APIRoute = async function post({ request }) {
  if (request.headers.get("Content-Type") === "application/json") {
    const body = await request.json();
    const { username, pubkey } = body;

    const usernameFormat = /^[0-9a-z-_\.]{1,64}$/g;
    const isUsernameValid = usernameFormat.test(username);

    const pubkeyFormat = /^[0-9a-f]{1,64}$/g;
    const isPubkeyValid = pubkeyFormat.test(pubkey);

    // stop here if username or pubkey are invalid
    if (!isUsernameValid || !isPubkeyValid) {
      return new Response(
        JSON.stringify({
          success: false,
        }),
        {
          status: 400,
        }
      );
    }

    // Use connect method to connect to the server
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(dbCollection);

    // find by username
    const existingUsers = await collection.find({ username }).toArray();
    // stop here if username exists
    if (existingUsers.length > 0) {
      client.close();
      return new Response(
        JSON.stringify({
          success: false,
        }),
        {
          status: 400,
        }
      );
    }

    // find by pubkey
    const existingPubkeys = await collection.find({ pubkey }).toArray();
    // stop here if username exists
    if (existingPubkeys.length > 0) {
      client.close();
      return new Response(
        JSON.stringify({
          success: false,
        }),
        {
          status: 400,
        }
      );
    }

    collection.insertOne({ username, pubkey });

    // console.log(`Added user: ${username}`);

    client.close();

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
      }
    );
  }

  return new Response(null, { status: 400 });
};
