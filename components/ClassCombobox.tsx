"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Class } from "@prisma/client";

interface ClassComboboxProps {
  onSelect?: (classId: string) => void;
}

interface ClassResponse {
  data: Class[];
  hasMore: boolean;
}

const PAGE_SIZE = 10;

export function ClassCombobox({ onSelect }: ClassComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const listRef = React.useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["classes", debouncedSearch],
    queryFn: async ({ pageParam }) => {
      const response = await axios.get<ClassResponse>(`/api/classes`, {
        params: {
          pageNumber: pageParam,
          pageSize: PAGE_SIZE,
          searchQuery: debouncedSearch,
        },
      });
      return response.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined;
    },
    enabled: open, // Only fetch when dropdown is open
  });

  // Handle scroll to load more
  React.useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = listElement;
      if (
        scrollTop + clientHeight >= scrollHeight - 20 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    listElement.addEventListener("scroll", handleScroll);
    return () => {
      listElement.removeEventListener("scroll", handleScroll);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Flatten
  const classes = React.useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  // Find the selected
  const selectedClass = React.useMemo(() => {
    return classes.find((item) => item.id === value);
  }, [classes, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value ? selectedClass?.name || "Đang tải..." : "Chọn lớp..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            placeholder="Tìm kiếm lớp..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList ref={listRef} className="max-h-[200px] overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Đang tải...</span>
              </div>
            ) : isError ? (
              <CommandEmpty>Lỗi khi tải dữ liệu.</CommandEmpty>
            ) : classes.length === 0 ? (
              <CommandEmpty>Không tìm thấy lớp nào.</CommandEmpty>
            ) : (
              <CommandGroup>
                {classes.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      if (onSelect) onSelect(currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Đang tải thêm...</span>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default ClassCombobox;
