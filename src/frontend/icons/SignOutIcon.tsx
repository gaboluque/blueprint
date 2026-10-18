import { STROKE_PATH_PROPS, StrokeIcon, type StrokeIconProps } from "./strokeIcon";

export function SignOutIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h12" {...STROKE_PATH_PROPS} />
    </StrokeIcon>
  );
}
