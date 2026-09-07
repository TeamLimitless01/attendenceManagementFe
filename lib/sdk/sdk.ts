import Strapi from "strapi-sdk-js";

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_STRAPI_URL) return process.env.NEXT_PUBLIC_STRAPI_URL;
    if (typeof window !== "undefined") return window.location.origin;
    return process.env.SITE_BASE_URL || "http://localhost:3000";
};

export const strapi = new Strapi({
    url: getBaseUrl(),
    prefix: "/api",
    axiosOptions: {
        headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_TOKEN || ''}`,
        },
    },
});

