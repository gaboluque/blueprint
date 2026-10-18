import { STROKE_PATH_PROPS, StrokeIcon, type StrokeIconProps } from "./strokeIcon";

export function UserIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" {...STROKE_PATH_PROPS} />
    </StrokeIcon>
  );
}
