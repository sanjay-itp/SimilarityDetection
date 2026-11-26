import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/** Opens the popup when the page is reached with ?new=1 (e.g. from the dashboard), then cleans the URL. */
export function useNewParam() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get("new") === "1");
  useEffect(() => {
    if (params.get("new") === "1") setParams({}, { replace: true });
  }, [params, setParams]);
  return [open, setOpen];
}
