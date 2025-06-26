// I'm sorry this is so confusing 😭

import classNames from "classnames";
import { useCallback, useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { mediaItemToId } from "@/backend/metadata/tmdb";
import { DotList } from "@/components/text/DotList";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { usePreferencesStore } from "@/stores/preferences";
import { MediaItem } from "@/utils/mediaTypes";

import { MediaBookmarkButton } from "./MediaBookmark";
import { IconPatch } from "../buttons/IconPatch";
import { Icon, Icons } from "../Icon";
import { DetailsModal } from "../overlays/details/DetailsModal";
import { useModal } from "../overlays/Modal";

export interface MediaCardProps {
  media: MediaItem;
  linkable?: boolean;
  series?: {
    episode: number;
    season?: number;
    episodeId: string;
    seasonId: string;
  };
  percentage?: number;
  closable?: boolean;
  onClose?: () => void;
  onShowDetails?: (media: MediaItem) => void;
}

function checkReleased(media: MediaItem): boolean {
  const isReleasedYear = Boolean(
    media.year && media.year <= new Date().getFullYear(),
  );
  const isReleasedDate = Boolean(
    media.release_date && media.release_date <= new Date(),
  );

  // If the media has a release date, use that, otherwise use the year
  const isReleased = media.release_date ? isReleasedDate : isReleasedYear;

  return isReleased;
}

function MediaCardContent({
  media,
  linkable,
  series,
  percentage,
  closable,
  onClose,
  onShowDetails,
}: MediaCardProps) {
  const { t } = useTranslation();
  const percentageString = `${Math.round(percentage ?? 0).toFixed(0)}%`;
  const cardRef = useRef<HTMLDivElement>(null);

  const isReleased = useCallback(() => checkReleased(media), [media]);
  const canLink = linkable && !closable && isReleased();

  const dotListContent = [t(`media.types.${media.type}`)];
  const [searchQuery] = useSearchQuery();
  const enableLowPerformanceMode = usePreferencesStore(
    (state) => state.enableLowPerformanceMode,
  );

  if (isReleased() && media.year) {
    dotListContent.push(media.year.toFixed());
  }

  if (!isReleased()) {
    dotListContent.push(t("media.unreleased"));
  }

  // Mouse position tracking for glow effect
  useEffect(() => {
    if (!canLink) return;

    const cards = document.querySelectorAll('.movie-card');
    if (cards.length === 0) return;

    const handleMouseMove = (e: MouseEvent) => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [canLink]);

  return (
    <>
      <style>{`
        .movie-card {
          --mouse-x: center;
          --mouse-y: center;
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
          isolation: isolate;
        }
        .glow-effect {
          background: radial-gradient(
            600px circle at var(--mouse-x) var(--mouse-y),
            rgba(255, 255, 255, 0.1) 0%,
            transparent 80%
          );
        }
        .image-container {
          transform: translateZ(0);
        }
        @media (hover: none) {
          .glow-effect {
            display: none;
          }
        }
      `}</style>

      <div
        ref={cardRef}
        className={`movie-card group relative overflow-hidden rounded-xl bg-background-main transition-all duration-150 ease-out ${
          canLink ? "hover:shadow-lg hover:shadow-mediaCard-hoverBackground/20" : ""
        }`}
        tabIndex={canLink ? 0 : -1}
        onKeyUp={(e) => e.key === "Enter" && e.currentTarget.click()}
      >
        {/* Glow effect */}
        <div 
          className="glow-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
          style={{ zIndex: 1 }}
        />

        {/* Card content container */}
        <div
          className={`relative p-2 transition-all duration-150 ease-out ${
            canLink ? "group-hover:scale-[0.98]" : "opacity-60"
          }`}
        >
          {/* Image container */}
          <div
            className={classNames(
              "image-container relative mb-4 pb-[150%] w-full overflow-hidden rounded-xl bg-mediaCard-hoverBackground bg-cover bg-center transition-all duration-150",
              {
                "group-hover:rounded-lg group-hover:shadow-inner group-hover:shadow-white/5": canLink,
              }
            )}
            style={{
              backgroundImage: media.poster
                ? `url(${media.poster})`
                : "url(/placeholder.png)",
            }}
          >
            {series ? (
              <div
                className={[
                  "absolute right-2 top-2 rounded-md bg-mediaCard-badge px-2 py-1 transition-colors",
                ].join(" ")}
              >
                <p
                  className={[
                    "text-center text-xs font-bold text-mediaCard-badgeText transition-colors",
                    closable ? "" : "group-hover:text-white",
                  ].join(" ")}
                >
                  {t("media.episodeDisplay", {
                    season: series.season || 1,
                    episode: series.episode,
                  })}
                </p>
              </div>
            ) : null}

            {percentage !== undefined ? (
              <>
                <div
                  className={`absolute inset-x-0 -bottom-px pb-1 h-12 bg-gradient-to-t from-mediaCard-shadow to-transparent transition-colors ${
                    canLink ? "group-hover:from-mediaCard-hoverShadow" : ""
                  }`}
                />
                <div
                  className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-mediaCard-shadow to-transparent transition-colors ${
                    canLink ? "group-hover:from-mediaCard-hoverShadow" : ""
                  }`}
                />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="relative h-1 overflow-hidden rounded-full bg-mediaCard-barColor">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-mediaCard-barFillColor"
                      style={{
                        width: percentageString,
                      }}
                    />
                  </div>
                </div>
              </>
            ) : null}

            {!closable && (
              <div
                className="absolute bookmark-button"
                onClick={(e) => e.preventDefault()}
              >
                <MediaBookmarkButton media={media} />
              </div>
            )}

            {searchQuery.length > 0 && !closable ? (
              <div className="absolute" onClick={(e) => e.preventDefault()}>
                <MediaBookmarkButton media={media} />
              </div>
            ) : null}

            <div
              className={`absolute inset-0 flex items-center justify-center bg-mediaCard-badge bg-opacity-80 transition-opacity duration-300 ${
                closable ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <IconPatch
                clickable
                className="text-2xl text-mediaCard-badgeText transition-transform hover:scale-110 duration-300"
                onClick={() => closable && onClose?.()}
                icon={Icons.X}
              />
            </div>
          </div>

          <h1 className="mb-1 line-clamp-3 max-h-[4.5rem] text-ellipsis break-words font-bold text-white">
            <span>{media.title}</span>
          </h1>
          <div className="media-info-container justify-content-center flex flex-wrap">
            <DotList className="text-xs" content={dotListContent} />
          </div>

          {!closable && !enableLowPerformanceMode && (
            <div className="absolute bottom-0 translate-y-1 right-1">
              <button
                className="media-more-button p-2"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onShowDetails?.(media);
                }}
              >
                <Icon
                  className="text-xs font-semibold text-type-secondary"
                  icon={Icons.ELLIPSIS}
                />
              </button>
            </div>
          )}
        </div>

        {/* Subtle hover border effect */}
        <div 
          className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/5 pointer-events-none transition-all duration-150"
          style={{ zIndex: 2 }}
        />
      </div>
    </>
  );
}

export function MediaCard(props: MediaCardProps) {
  const { media, onShowDetails } = props;
  const [detailsData, setDetailsData] = useState<{
    id: number;
    type: "movie" | "show";
  } | null>(null);
  const detailsModal = useModal("details");
  const enableDetailsModal = usePreferencesStore(
    (state) => state.enableDetailsModal,
  );

  const isReleased = useCallback(
    () => checkReleased(props.media),
    [props.media],
  );

  const canLink = props.linkable && !props.closable && isReleased();

  let link = canLink
    ? `/media/${encodeURIComponent(mediaItemToId(props.media))}`
    : "#";
  if (canLink && props.series) {
    if (props.series.season === 0 && !props.series.episodeId) {
      link += `/${encodeURIComponent(props.series.seasonId)}`;
    } else {
      link += `/${encodeURIComponent(
        props.series.seasonId,
      )}/${encodeURIComponent(props.series.episodeId)}`;
    }
  }

  const handleShowDetails = useCallback(async () => {
    if (onShowDetails) {
      onShowDetails(media);
      return;
    }

    setDetailsData({
      id: Number(media.id),
      type: media.type === "movie" ? "movie" : "show",
    });
    detailsModal.show();
  }, [media, detailsModal, onShowDetails]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (enableDetailsModal && canLink) {
      e.preventDefault();
      handleShowDetails();
    }
  };

  const content = (
    <>
      <MediaCardContent {...props} onShowDetails={handleShowDetails} />
      {detailsData && <DetailsModal id="details" data={detailsData} />}
    </>
  );

  if (!canLink) {
    return (
      <span
        className="relative"
        onClick={(e) => {
          if (e.defaultPrevented) {
            e.preventDefault();
          }
        }}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      to={link}
      tabIndex={-1}
      className={classNames(
        "tabbable",
        props.closable ? "hover:cursor-default" : "",
      )}
      onClick={handleCardClick}
    >
      {content}
    </Link>
  );
}
