interface NoteProps {
  children: React.ReactNode;
}

const Note: React.FC<NoteProps> = ({ children }) => {
  return (
    <div className="px-5 py-2 text-navy font-lato border border-[#CAD9EF] bg-[#F7F7F9] rounded-2xl">
      <div className="tag-line-xs leading-1.5">
        <b>Note:</b> {children}
      </div>
    </div>
  );
};

export default Note;
