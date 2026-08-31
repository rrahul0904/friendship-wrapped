import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { OCCASION_MODES, STORY_MODES } from "@/platform/story/modes";

export const metadata = {
  title: "ThreadTales Occasions — Birthday, Anniversary & More",
  description: "Turn a private chat export into a birthday, anniversary, long-distance, graduation or year-together story.",
};

export default function OccasionsPage() {
  return <><Header/><main className="shell section occasion-page"><span className="kicker">One analyzer · different moments</span><h1>Make the story fit the occasion.</h1><p className="section-copy">The underlying analysis stays deterministic and private. The chapter order, copy and export treatment change to match why you are making it.</p><div className="occasion-grid">{OCCASION_MODES.map((id) => {
    const mode = STORY_MODES[id];
    return <Link className={`occasion-card theme-${mode.theme}`} href={`/occasions/${id}`} key={id}><small>{mode.label}</small><h2>{mode.eyebrow}</h2><p>{mode.seoDescription}</p><span>Build this story →</span></Link>;
  })}</div></main><Footer/></>;
}
