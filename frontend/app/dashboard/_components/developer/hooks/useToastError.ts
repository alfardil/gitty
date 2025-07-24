import { toast } from "sonner";

export function showApiErrorToast(errorData: any) {
  let errorMsg = "Unknown error";
  if (typeof errorData === "string") {
    errorMsg = errorData;
  } else if (errorData && typeof errorData.message === "string") {
    errorMsg = errorData.message;
  } else if (
    Array.isArray(errorData) &&
    errorData.length &&
    errorData[0]?.message
  ) {
    errorMsg = errorData[0].message;
  } else {
    errorMsg = JSON.stringify(errorData);
  }
  toast.error(errorMsg);
}
