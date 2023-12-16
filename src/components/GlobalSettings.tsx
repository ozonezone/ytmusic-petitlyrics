import { createForm } from "@felte/solid";
import {
  GlobalSettings as GlobalSettingsType,
  globalSettings,
  setGlobalSettings,
} from "../store";

export const GlobalSettings = () => {
  const { form } = createForm<GlobalSettingsType>({
    onSubmit: async (values) => {
      /* call to an api */
    },
  });
  return (
    <div>
      <form use:form>
        <input type="text" name="email" />
        <input type="password" name="password" />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};
