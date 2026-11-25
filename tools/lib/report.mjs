// Collects what the checks find and prints it: what is wrong, where, and how to put it right.
export class Report {
  constructor() { this.problems = []; this.counts = new Map(); }

  // rule: short id such as "layout/centred". where: file or page. fix: one sentence (optional).
  add(rule, where, message, fix) { this.problems.push({ rule, where, message, fix }); }

  // Remembers that a rule ran, so that "0 problems" can never mean "nothing was checked".
  ran(rule, amount = 1) { this.counts.set(rule, (this.counts.get(rule) ?? 0) + amount); }

  print() {
    const groups = new Map();
    for (const { rule, where, message, fix } of this.problems) {
      const key = `${rule}\n${message}`;
      const group = groups.get(key) ?? { rule, message, fix, places: new Set() };
      group.places.add(where);
      groups.set(key, group);
    }
    for (const { rule, message, fix, places } of groups.values()) {
      const list = [...places];
      const more = list.length > 6 ? ` and ${list.length - 6} more` : "";
      console.log(`✖ ${rule}: ${message}\n    in  ${list.slice(0, 6).join(", ")}${more}`);
      if (fix) console.log(`    fix ${fix}`);
    }
    return groups.size;
  }
}
