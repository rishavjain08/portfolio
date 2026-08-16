import { useState } from "react";
import { details } from "../config/projects";
import { ProjectStackCard } from "./ProjectStackCard";
import { SectionHeading } from "./SectionHeading";

/**
 * Projects as an overlapping deck.
 *
 * Cards are pulled up into each other so the section reads as a stack with
 * depth rather than a list. Opening one expands it in place and pushes the card
 * below back down, which is the whole navigation model: no rail to scroll, no
 * dialog to dismiss, and every project's detail lives inside its own card.
 *
 * Replaces the horizontal rail, the hover-flip card and the modal. The rail's
 * wheel capture, snap padding and paging all existed to move sideways through
 * seven cards, and none of that is needed once the deck runs vertically.
 */
export function Projects() {
  // One open at a time, and none to begin with: the deck arrives fully stacked
  // so the layering is what the section leads with.
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const openIndex = details.findIndex((d) => d.id === openId);

  return (
    <section id="projects" aria-label="Projects" className="relative z-10 bg-stage">
      <div className="mx-auto w-full max-w-5xl px-5 pt-28 md:px-8 md:pt-40">
        <SectionHeading label="Selected systems" title="Systems built to stay up." />

        {/*
          Overlap lives in a custom property so the two breakpoints are declared
          once, and each card reads it. The card after the open one releases the
          overlap, because it would otherwise ride up over that card's content.
        */}
        <ul id="project-deck" className="mt-14 pb-28 [--overlap:20px] md:mt-20 md:pb-40 md:[--overlap:26px]">
          {details.map((d, i) => (
            <ProjectStackCard
              key={d.id}
              detail={d}
              index={i}
              total={details.length}
              active={openId === d.id}
              hovered={hoverId === d.id}
              offset={i === 0 ? "0px" : openIndex === i - 1 ? "18px" : "calc(-1 * var(--overlap))"}
              onToggle={() => setOpenId((cur) => (cur === d.id ? null : d.id))}
              onHover={(on) => setHoverId(on ? d.id : null)}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
