import { STROKE_PATH_PROPS, StrokeIcon, type StrokeIconProps } from "./strokeIcon";

export function InstitutionsIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6M4 21h16" {...STROKE_PATH_PROPS} />
    </StrokeIcon>
  );
}
