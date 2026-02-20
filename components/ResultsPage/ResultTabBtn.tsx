interface ResultTabBtnProps {
  onClick: () => void;
  activeTab: string;
  text: string;
  tabText: string;
}

const ResultTabBtn = ({
  onClick,
  activeTab,
  text,
  tabText,
}: ResultTabBtnProps) => {
  return (
    <button
      onClick={onClick}
      className={`py-2 cursor-pointer px-4 text-sm font-medium ${activeTab === tabText
          ? "bg-[var(--theme-color)] text-white transition-all duration-300 rounded-full"
          : "dark:text-gray-400 text-gray-600 dark:hover:text-gray-200 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-400 dark:hover:border-gray-600"
        }`}
    >
      {text}
    </button>
  );
};

export default ResultTabBtn;
