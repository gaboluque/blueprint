import { STROKE_PATH_PROPS, StrokeIcon, type StrokeIconProps } from "./strokeIcon";

export function TrashIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M9 3h6M4 6h16M7 6v13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6" {...STROKE_PATH_PROPS} />
      <path d="M10 10v6M14 10v6" {...STROKE_PATH_PROPS} />
    </StrokeIcon>
  );
}
