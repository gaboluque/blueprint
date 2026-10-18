import { STROKE_PATH_PROPS, StrokeIcon, type StrokeIconProps } from "./strokeIcon";

export function PlusIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 5v14M5 12h14" {...STROKE_PATH_PROPS} />
    </StrokeIcon>
  );
}
