import { createFileRoute } from "@tanstack/react-router";
import FilmsPage from "../pages/FilmsPage";

export const Route = createFileRoute("/films")({
  component: FilmsPage,
});