import { STROKE_PATH_PROPS, StrokeIcon, type StrokeIconProps } from "./strokeIcon";

export function EditIcon(props: StrokeIconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M16.862 4.487 19.5 7.125l-9.75 9.75H7.125v-2.625l9.737-9.763Z" {...STROKE_PATH_PROPS} />
      <path d="M14.25 6.75 17.25 9.75" {...STROKE_PATH_PROPS} />
    </StrokeIcon>
  );
}
