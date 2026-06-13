import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CREATOR_TAGS } from '../lib/constants';

interface Props {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function CreatorTagSelector({ selectedTags, onChange }: Props) {
  const [customTag, setCustomTag] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      onChange([...selectedTags, trimmed]);
    }
    setCustomTag('');
  };

  return (
    <div className="space-y-4">
      {/* Archetype grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CREATOR_TAGS.map((tag) => {
          const isActive = selectedTags.includes(tag.archetype);
          const isOpen = selectedArchetype === tag.archetype;
          return (
            <div key={tag.archetype} className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  toggleTag(tag.archetype);
                  setSelectedArchetype(isOpen ? null : tag.archetype);
                }}
                className={`w-full px-3 py-2 rounded-xl border text-sm transition-all text-left ${
                  isActive
                    ? 'border-gold-400/40 bg-gold-400/10 text-cream'
                    : 'border-lavender/10 bg-void-800/40 text-lavender/60 hover:border-lavender/30'
                }`}
              >
                <span className="mr-1.5">{tag.emoji}</span>
                <span className={isActive ? 'text-cream' : ''}>{tag.archetype}</span>
              </button>

              {/* Specialization chips */}
              {isOpen && tag.specializations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-wrap gap-1 pl-1"
                >
                  {tag.specializations.map((spec) => {
                    const specActive = selectedTags.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleTag(spec)}
                        className={`px-2 py-0.5 rounded-full text-xs transition-all ${
                          specActive
                            ? 'bg-magenta-400/20 text-magenta-300 border border-magenta-400/30'
                            : 'bg-void-900 border border-lavender/10 text-lavender/50 hover:text-lavender/70'
                        }`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom tag input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustomTag();
            }
          }}
          placeholder="Add a custom role..."
          className="flex-1 px-3 py-2 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 text-sm focus:border-gold-400/40 focus:outline-none"
        />
        <button
          type="button"
          onClick={addCustomTag}
          className="px-3 py-2 rounded-xl border border-lavender/20 text-lavender/60 hover:border-gold-400/40 hover:text-gold-300 transition-all text-sm"
        >
          Add
        </button>
      </div>

      {/* Selected tags summary */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-300 text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="text-gold-400/60 hover:text-gold-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
