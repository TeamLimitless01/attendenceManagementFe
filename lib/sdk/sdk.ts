import Strapi from "strapi-sdk-js";

export const strapi = new Strapi({
    url: process.env.NEXT_PUBLIC_STRAPI_URL,
    prefix: "/api",
    axiosOptions: {
        headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_TOKEN}`,
        },
    },
});