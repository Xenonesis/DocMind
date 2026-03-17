import re
import sys


def main():
    with open(
        "src/components/settings/ai-api-settings.tsx", "r", encoding="utf-8"
    ) as f:
        content = f.read()

    # Replacements
    # Rounded classes
    content = re.sub(r"rounded-\[?[\w\.]+\]?", "rounded-none", content)
    content = re.sub(r"rounded-xl", "rounded-none", content)
    content = re.sub(r"rounded-2xl", "rounded-none", content)
    content = re.sub(r"rounded-3xl", "rounded-none", content)
    content = re.sub(r"rounded-full", "rounded-none", content)
    content = re.sub(r"rounded-lg", "rounded-none", content)
    content = re.sub(r"rounded-md", "rounded-none", content)

    # Shadow and border classes
    content = re.sub(r"shadow-\[?[\w\-\/]+\]?", "brutal-shadow", content)
    content = re.sub(r"shadow-sm", "brutal-shadow", content)
    content = re.sub(r"shadow-lg", "brutal-shadow", content)
    content = re.sub(r"shadow-xl", "brutal-shadow", content)
    content = re.sub(r"shadow-2xl", "brutal-shadow", content)

    # Gradients and blurs
    content = re.sub(r"bg-gradient-to-\w+", "", content)
    content = re.sub(r"from-[\w\-\/]+", "", content)
    content = re.sub(r"via-[\w\-\/]+", "", content)
    content = re.sub(r"to-[\w\-\/]+", "", content)
    content = re.sub(r"backdrop-blur-\w+", "", content)
    content = re.sub(r"bg-clip-text text-transparent", "text-foreground", content)

    # Soft background colors
    content = re.sub(r"bg-white/60 dark:bg-slate-800/60", "bg-background", content)
    content = re.sub(
        r"bg-white/40 dark:bg-slate-900/40", "bg-foreground text-background", content
    )
    content = re.sub(r"bg-white/80 dark:bg-slate-800/80", "bg-background", content)
    content = re.sub(r"bg-slate-50 dark:bg-slate-800/80", "bg-muted", content)
    content = re.sub(
        r"bg-slate-100/80 dark:bg-slate-800/80",
        "bg-muted border-4 border-foreground",
        content,
    )
    content = re.sub(r"bg-slate-100 dark:bg-slate-800", "bg-muted", content)
    content = re.sub(r"bg-slate-50 dark:bg-slate-800/50", "bg-background", content)

    # Borders
    content = re.sub(
        r"border-slate-200/50 dark:border-slate-700/50",
        "border-4 border-foreground",
        content,
    )
    content = re.sub(
        r"border-slate-200 dark:border-slate-700", "border-2 border-foreground", content
    )
    content = re.sub(
        r"border-slate-100 dark:border-slate-700/50",
        "border-4 border-foreground",
        content,
    )
    content = re.sub(
        r"border-white/20 dark:border-slate-700/50",
        "border-4 border-foreground",
        content,
    )

    # Text colors
    content = re.sub(
        r"text-slate-800 dark:text-slate-200",
        "text-foreground font-black uppercase",
        content,
    )
    content = re.sub(
        r"text-slate-600 dark:text-slate-400",
        "text-foreground opacity-80 font-bold",
        content,
    )
    content = re.sub(
        r"text-slate-500 dark:text-slate-400",
        "text-foreground opacity-70 font-bold",
        content,
    )
    content = re.sub(r"text-white", "text-white", content)

    # Button styling
    content = re.sub(
        r"bg-gradient-to-r.*hover:to-indigo-700 text-white",
        "bg-accent text-white border-4 border-foreground hover:bg-foreground",
        content,
    )

    # Font mono everywhere
    if "font-mono" not in content[:500]:
        content = content.replace(
            '<div className="space-y-4 sm:space-y-6">',
            '<div className="space-y-4 sm:space-y-6 font-mono">',
        )

    # Remove generic absolute gradients
    content = re.sub(
        r'<div className="absolute inset-0 bg-gradient.*?" />\s*', "", content
    )

    # Some specific label renames
    content = content.replace("AI API Integration Settings", "AI_API_INTEGRATION_NODE")
    content = content.replace("Global AI Settings", "GLOBAL_AI_DIRECTIVES")
    content = content.replace("Security & Privacy", "SECURITY_PROTOCOLS")
    content = content.replace("Performance Optimization", "PERFORMANCE_TUNING")
    content = content.replace("Monitoring & Alerts", "TELEMETRY_SYSTEMS")
    content = content.replace("API Usage & Metrics", "API_USAGE_METRICS")

    with open(
        "src/components/settings/ai-api-settings.tsx", "w", encoding="utf-8"
    ) as f:
        f.write(content)

    print("Replacements done!")


if __name__ == "__main__":
    main()
