import { STROKE_PATH_PROPS, StrokeIcon, type StrokeIconProps } from "./strokeIcon";

export function CloseIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M18 6 6 18" {...STROKE_PATH_PROPS} />
      <path d="m6 6 12 12" {...STROKE_PATH_PROPS} />
    </StrokeIcon>
  );
}
