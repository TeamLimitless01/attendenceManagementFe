import useSWR from "swr";
import { strapi } from "./sdk";

const fetcher = async (url: string, query = {}) => {
    const res = await strapi.find(url, query);
    return res;
};

export function useStrapi(collection: string, query = {}, options = {}) {
    return useSWR([collection, query], ([c, q]) => fetcher(c, q), {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        ...options,
    });
}