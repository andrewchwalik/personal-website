// Shared branches meet before the main trail, so do not retrace their common stem.
export function branchTransfer(source, destination, position) {
  if (!source || !destination || position === null) return null;
  const end = destination.path.getTotalLength();
  if (source === destination) return [{ branch: source, from: position, to: end }];
  if (!source.sharedStem || source.sharedStem !== destination.sharedStem) return null;
  const junction = source.sharedLength;
  if (position <= junction) return [{ branch: destination, from: position, to: end }];
  return [
    { branch: source, from: position, to: junction },
    { branch: destination, from: destination.sharedLength, to: end },
  ];
}
