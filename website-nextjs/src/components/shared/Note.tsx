interface NoteProps {
  children: React.ReactNode;
}

const Note: React.FC<NoteProps> = ({ children }) => {
  return (
    <div className="lg:px-5 p-2 text-navy font-lato border border-[#CAD9EF] bg-[#F7F7F9] rounded-2xl">
      <div className="tag-line-sm lg:text-[13px] leading-1.5">
        <b>Note:</b> {children}
      </div>
    </div>
  );
};

export default Note;
