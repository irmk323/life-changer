package com.example.leetcodetrainer.review.controller;

import com.example.leetcodetrainer.problem.service.ProblemCatalogService;
import com.example.leetcodetrainer.review.domain.ReviewQueueFilter;
import com.example.leetcodetrainer.review.domain.ReviewType;
import com.example.leetcodetrainer.review.service.ReviewSchedulingService;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class ReviewController {
    private final ReviewSchedulingService reviewService;
    private final ProblemCatalogService problemCatalogService;
    public ReviewController(ReviewSchedulingService reviewService, ProblemCatalogService problemCatalogService) { this.reviewService = reviewService; this.problemCatalogService = problemCatalogService; }

    @GetMapping("/reviews")
    public String queue(@RequestParam(required = false) ReviewQueueFilter filter, @RequestParam(required = false) ReviewType type, Model model) {
        ReviewQueueFilter selected = filter == null ? ReviewQueueFilter.DUE_TODAY : filter;
        model.addAttribute("reviews", reviewService.queue(selected, type)); model.addAttribute("filters", ReviewQueueFilter.values());
        model.addAttribute("types", ReviewType.values()); model.addAttribute("selectedFilter", selected); model.addAttribute("selectedType", type);
        return "reviews/queue";
    }
    @GetMapping("/reviews/{id}")
    public String detail(@PathVariable UUID id, Model model) {
        model.addAttribute("review", reviewService.detail(id)); model.addAttribute("activeProblems", problemCatalogService.findActiveProblems(null, null));
        return "reviews/detail";
    }
    @PostMapping("/reviews/{id}/start")
    public String start(@PathVariable UUID id, RedirectAttributes attributes) {
        try { return "redirect:/attempts/" + reviewService.startReview(id).getId() + "/workspace"; }
        catch (IllegalArgumentException | IllegalStateException exception) { attributes.addFlashAttribute("error", exception.getMessage()); return "redirect:/reviews/" + id; }
    }
    @PostMapping("/reviews/{id}/assign-problem")
    public String assign(@PathVariable UUID id, @RequestParam UUID problemId, RedirectAttributes attributes) {
        try { reviewService.assignProblem(id, problemId); attributes.addFlashAttribute("message", "復習課題を割り当てました。"); }
        catch (IllegalArgumentException | IllegalStateException exception) { attributes.addFlashAttribute("error", exception.getMessage()); }
        return "redirect:/reviews/" + id;
    }
    @PostMapping("/reviews/{id}/reschedule")
    public String reschedule(@PathVariable UUID id, @RequestParam LocalDate scheduledDate, @RequestParam(required = false) String reason,
                             RedirectAttributes attributes) {
        try { reviewService.reschedule(id, scheduledDate, reason); attributes.addFlashAttribute("message", "復習日を変更しました。"); }
        catch (IllegalArgumentException | IllegalStateException exception) { attributes.addFlashAttribute("error", exception.getMessage()); }
        return "redirect:/reviews/" + id;
    }
    @PostMapping("/reviews/{id}/cancel")
    public String cancel(@PathVariable UUID id, RedirectAttributes attributes) {
        try { reviewService.cancel(id); attributes.addFlashAttribute("message", "復習をキャンセルしました。"); }
        catch (IllegalArgumentException | IllegalStateException exception) { attributes.addFlashAttribute("error", exception.getMessage()); }
        return "redirect:/reviews/" + id;
    }
    @PostMapping("/reviews/{id}/follow-up")
    public String followUp(@PathVariable UUID id, @RequestParam(required = false) String reason, RedirectAttributes attributes) {
        try { var followUp = reviewService.createFollowUp(id, reason); attributes.addFlashAttribute("message", "翌日の再確認を作成しました。"); return "redirect:/reviews/" + followUp.getId(); }
        catch (IllegalArgumentException | IllegalStateException exception) { attributes.addFlashAttribute("error", exception.getMessage()); return "redirect:/reviews/" + id; }
    }
}
