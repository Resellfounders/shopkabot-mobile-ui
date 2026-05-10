import { Platform } from "react-native";

type MetadataOptions = {
  title: string;
  description?: string;
};

export function setWebPageMetadata({ title, description }: MetadataOptions) {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return;
  }

  document.title = title;

  if (!description) {
    return;
  }

  let metaDescription = document.querySelector(
    'meta[name="description"]',
  ) as HTMLMetaElement | null;

  if (!metaDescription) {
    metaDescription = document.createElement("meta");
    metaDescription.name = "description";
    document.head.appendChild(metaDescription);
  }

  metaDescription.content = description;
}
